package com.example.shop.auth;

import net.jqwik.api.*;
import net.jqwik.api.constraints.AlphaChars;
import net.jqwik.api.constraints.StringLength;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link AuthService}.
 * Requirements: 1.1, 1.2, 1.3, 1.6
 */
@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private User adminUser;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1L)
                .username("admin")
                .passwordHash("$2a$10$hashedpassword")
                .role(Role.ADMIN)
                .build();
    }

    /**
     * Requirement 1.2: Correct credentials return an AuthResponse with a non-null token.
     */
    @Test
    void login_correctCredentials_returnsAuthResponseWithToken() {
        LoginRequest request = new LoginRequest("admin", "admin123");

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(adminUser));
        when(passwordEncoder.matches("admin123", adminUser.getPasswordHash())).thenReturn(true);
        when(jwtUtil.generateToken(adminUser)).thenReturn("signed.jwt.token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertNotNull(response.token());
        assertEquals("signed.jwt.token", response.token());
        assertEquals("admin", response.username());
        assertEquals("ADMIN", response.role());

        verify(userRepository).findByUsername("admin");
        verify(passwordEncoder).matches("admin123", adminUser.getPasswordHash());
        verify(jwtUtil).generateToken(adminUser);
    }

    /**
     * Requirement 1.3: Wrong password throws BadCredentialsException and no token is issued.
     */
    @Test
    void login_wrongPassword_throwsBadCredentialsException() {
        LoginRequest request = new LoginRequest("admin", "wrongpassword");

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(adminUser));
        when(passwordEncoder.matches("wrongpassword", adminUser.getPasswordHash())).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(request));

        verify(userRepository).findByUsername("admin");
        verify(passwordEncoder).matches("wrongpassword", adminUser.getPasswordHash());
        verify(jwtUtil, never()).generateToken(any());
    }

    /**
     * Requirement 1.3: Unknown username throws BadCredentialsException and no token is issued.
     */
    @Test
    void login_unknownUsername_throwsBadCredentialsException() {
        LoginRequest request = new LoginRequest("unknown", "anypassword");

        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class, () -> authService.login(request));

        verify(userRepository).findByUsername("unknown");
        verify(passwordEncoder, never()).matches(any(), any());
        verify(jwtUtil, never()).generateToken(any());
    }

    /**
     * Property 2: Invalid credentials never produce a token.
     *
     * For any arbitrary username/password pair where the password does NOT match
     * the stored BCrypt hash, login() must always throw BadCredentialsException
     * and never return an AuthResponse with a token.
     *
     * Validates: Requirements 1.3
     */
    @Property(tries = 200)
    void property_invalidCredentials_neverProduceToken(
            @ForAll @AlphaChars @StringLength(min = 1, max = 50) String username,
            @ForAll @AlphaChars @StringLength(min = 1, max = 100) String password
    ) {
        // Create mocks manually — jqwik properties don't use Mockito's @Mock injection
        UserRepository mockUserRepo = mock(UserRepository.class);
        PasswordResetTokenRepository mockResetTokenRepo = mock(PasswordResetTokenRepository.class);
        PasswordEncoder mockPasswordEncoder = mock(PasswordEncoder.class);
        JwtUtil mockJwtUtil = mock(JwtUtil.class);

        AuthService service = new AuthService(mockUserRepo, mockResetTokenRepo, mockPasswordEncoder, mockJwtUtil);

        // A stored user with a known hash that will never match the generated password
        User storedUser = User.builder()
                .id(1L)
                .username(username)
                .passwordHash("$2a$10$fixedHashThatNeverMatchesArbitraryInput")
                .role(Role.USER)
                .build();

        when(mockUserRepo.findByUsername(username)).thenReturn(Optional.of(storedUser));
        // Simulate password mismatch — the core invariant under test
        when(mockPasswordEncoder.matches(password, storedUser.getPasswordHash())).thenReturn(false);

        LoginRequest request = new LoginRequest(username, password);

        assertThrows(
                BadCredentialsException.class,
                () -> service.login(request),
                "login() must throw BadCredentialsException when password does not match"
        );

        // Token generation must never be called when credentials are invalid
        verify(mockJwtUtil, never()).generateToken(any());
    }
}
