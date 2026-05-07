package com.example.shop.auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller exposing authentication endpoints:
 * login, register, forgot-password, reset-password, and change-password.
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Authenticates a user and returns a JWT token.
     *
     * @param request the login credentials
     * @return 200 with {@link AuthResponse} on success, or 401 on bad credentials
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Registers a new user account with the USER role.
     * The user is immediately logged in — a JWT is returned.
     *
     * @param request the registration details (username, email, password)
     * @return 201 with {@link AuthResponse} containing a JWT
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Initiates the forgot-password flow.
     * Returns a reset token (in production this would be emailed to the user).
     *
     * @param request the email address of the account
     * @return 200 with a {@link ForgotPasswordResponse} containing the reset token
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        ForgotPasswordResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Resets the user's password using a valid reset token.
     *
     * @param request the reset token and new password
     * @return 200 with a success message
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully. You can now log in."));
    }

    /**
     * Changes the password for the currently authenticated user.
     *
     * @param userDetails the authenticated user (injected by Spring Security)
     * @param request     the current and new passwords
     * @return 200 with a success message
     */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
    }
}
