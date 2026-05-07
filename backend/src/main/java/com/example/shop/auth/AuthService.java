package com.example.shop.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Service responsible for authenticating users, registration, and password management.
 * Also implements {@link UserDetailsService} for Spring Security integration.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    /** Password reset token validity in hours. */
    private static final long RESET_TOKEN_EXPIRY_HOURS = 1;

    /**
     * Authenticates a user and returns a JWT token along with identity information.
     *
     * @param request the login request containing username and password
     * @return an {@link AuthResponse} with the signed JWT, username, and role
     * @throws BadCredentialsException if the username is not found or the password does not match
     */
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> {
                    log.warn("Login attempt for unknown username: {}", request.username());
                    return new BadCredentialsException("Invalid username or password");
                });

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            log.warn("Invalid password for username: {}", request.username());
            throw new BadCredentialsException("Invalid username or password");
        }

        String token = jwtUtil.generateToken(user);
        log.info("Successful login for username: {}", user.getUsername());
        return new AuthResponse(token, user.getUsername(), user.getRole().name());
    }

    /**
     * Registers a new user with the USER role.
     *
     * @param request the registration request containing username, email, and password
     * @return an {@link AuthResponse} with a JWT so the user is immediately logged in
     * @throws IllegalArgumentException if the username or email is already taken
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username '" + request.username() + "' is already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email '" + request.email() + "' is already registered");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .build();

        userRepository.save(user);
        log.info("Registered new user: {}", user.getUsername());

        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, user.getUsername(), user.getRole().name());
    }

    /**
     * Initiates the forgot-password flow by generating a reset token.
     * In a production system this token would be emailed; here it is returned
     * in the response so the frontend can drive the reset flow without SMTP setup.
     *
     * @param request the forgot-password request containing the user's email
     * @return a {@link ForgotPasswordResponse} containing the reset token
     * @throws IllegalArgumentException if no account is found for the given email
     */
    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> {
                    log.warn("Forgot-password request for unknown email: {}", request.email());
                    // Return a generic message to avoid user enumeration
                    return new IllegalArgumentException("No account found with that email address");
                });

        // Invalidate any existing tokens for this user
        passwordResetTokenRepository.deleteByUser(user);

        String rawToken = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(rawToken)
                .user(user)
                .expiryDate(Instant.now().plus(RESET_TOKEN_EXPIRY_HOURS, ChronoUnit.HOURS))
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);
        log.info("Generated password reset token for user: {}", user.getUsername());

        // In production: send email with reset link containing the token.
        // For this app the token is returned directly so the UI can redirect.
        return new ForgotPasswordResponse(
                rawToken,
                "Password reset token generated. Use it within " + RESET_TOKEN_EXPIRY_HOURS + " hour(s)."
        );
    }

    /**
     * Resets the user's password using a valid, unexpired reset token.
     *
     * @param request the reset-password request containing the token and new password
     * @throws IllegalArgumentException if the token is invalid, expired, or already used
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.token())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("Reset token has already been used");
        }
        if (resetToken.isExpired()) {
            throw new IllegalArgumentException("Reset token has expired. Please request a new one");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Password successfully reset for user: {}", user.getUsername());
    }

    /**
     * Changes the password for an already-authenticated user.
     *
     * @param username    the currently authenticated user
     * @param request     the change-password request
     * @throws BadCredentialsException  if the current password is wrong
     * @throws UsernameNotFoundException if the user no longer exists
     */
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        log.info("Password changed for user: {}", username);
    }

    /**
     * Loads a user by username for Spring Security's authentication mechanism.
     *
     * @param username the username to look up
     * @return a {@link UserDetails} instance for the found user
     * @throws UsernameNotFoundException if no user with the given username exists
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
