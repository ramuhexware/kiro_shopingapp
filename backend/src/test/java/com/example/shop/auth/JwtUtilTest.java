package com.example.shop.auth;

import io.jsonwebtoken.Claims;
import net.jqwik.api.*;
import net.jqwik.api.constraints.AlphaChars;
import net.jqwik.api.constraints.LongRange;
import net.jqwik.api.constraints.StringLength;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Tests for {@link JwtUtil}.
 *
 * <p>Property 1: JWT round-trip preserves identity claims.
 * For any valid User (with any username, userId, and role), generating a JWT and then
 * parsing it SHALL produce the same username, userId, and role that were encoded.
 *
 * <p>Validates: Requirements 1.2, 1.4
 */
class JwtUtilTest {

    // Secret must be at least 256 bits (32 chars) for HMAC-SHA256
    private static final String TEST_SECRET =
            "test-jwt-secret-key-must-be-at-least-256-bits-long-for-hs256!!";

    // Initialized as a field so it is available for both JUnit 5 (@Test) and
    // jqwik (@Property) lifecycle — jqwik does not call @BeforeEach before properties.
    private final JwtUtil jwtUtil = new JwtUtil(TEST_SECRET);

    // -------------------------------------------------------------------------
    // Property 1: JWT round-trip preserves identity claims
    // Tag: Feature: role-based-access-control, Property 1: JWT round-trip preserves identity claims
    // -------------------------------------------------------------------------

    /**
     * Property 1 — JWT round-trip preserves identity claims.
     * Generates arbitrary User instances (random usernames, IDs, both roles) and asserts
     * that parseToken(generateToken(user)) returns matching sub, userId, and role claims.
     */
    @Property(tries = 200)
    void jwtRoundTripPreservesIdentityClaims(
            @ForAll @AlphaChars @StringLength(min = 1, max = 50) String username,
            @ForAll @LongRange(min = 1, max = Long.MAX_VALUE) long userId,
            @ForAll Role role) {

        User user = User.builder()
                .id(userId)
                .username(username)
                .passwordHash("irrelevant-for-jwt")
                .role(role)
                .build();

        String token = jwtUtil.generateToken(user);
        Claims claims = jwtUtil.parseToken(token);

        assertThat(claims.getSubject())
                .as("sub claim should match username")
                .isEqualTo(username);

        assertThat(claims.get("userId", Long.class))
                .as("userId claim should match user id")
                .isEqualTo(userId);

        assertThat(claims.get("role", String.class))
                .as("role claim should match role name")
                .isEqualTo(role.name());
    }

    /**
     * Property 1 (convenience wrappers) — extract* methods return the same values
     * as direct claim access.
     */
    @Property(tries = 200)
    void extractMethodsMatchDirectClaimAccess(
            @ForAll @AlphaChars @StringLength(min = 1, max = 50) String username,
            @ForAll @LongRange(min = 1, max = Long.MAX_VALUE) long userId,
            @ForAll Role role) {

        User user = User.builder()
                .id(userId)
                .username(username)
                .passwordHash("irrelevant-for-jwt")
                .role(role)
                .build();

        String token = jwtUtil.generateToken(user);

        assertThat(jwtUtil.extractUsername(token)).isEqualTo(username);
        assertThat(jwtUtil.extractUserId(token)).isEqualTo(userId);
        assertThat(jwtUtil.extractRole(token)).isEqualTo(role.name());
    }

    // -------------------------------------------------------------------------
    // Unit tests
    // -------------------------------------------------------------------------

    @Test
    void generateToken_producesNonNullCompactString() {
        User user = buildUser(1L, "admin", Role.ADMIN);
        String token = jwtUtil.generateToken(user);
        assertThat(token).isNotBlank();
        // JWT compact form has exactly 3 dot-separated segments
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    void parseToken_throwsOnTamperedToken() {
        User user = buildUser(1L, "admin", Role.ADMIN);
        String token = jwtUtil.generateToken(user);
        // Replace the last character with a different one to corrupt the signature.
        // Use a two-character swap so the replacement is always different from the original.
        char lastChar = token.charAt(token.length() - 1);
        char replacement = (lastChar == 'A') ? 'B' : 'A';
        String tampered = token.substring(0, token.length() - 1) + replacement;

        assertThatThrownBy(() -> jwtUtil.parseToken(tampered))
                .isInstanceOf(io.jsonwebtoken.JwtException.class);
    }

    @Test
    void parseToken_throwsOnExpiredToken() throws Exception {
        // Build a JwtUtil with a 1 ms expiry by using reflection to override EXPIRY_MS
        // Instead, we verify the contract by generating a token with a past expiry via
        // a dedicated helper that sets expiry in the past.
        String expiredToken = buildExpiredToken("user", 2L, Role.USER);

        assertThatThrownBy(() -> jwtUtil.parseToken(expiredToken))
                .isInstanceOf(io.jsonwebtoken.JwtException.class);
    }

    @Test
    void generateToken_adminRoleIsEncodedCorrectly() {
        User admin = buildUser(10L, "admin", Role.ADMIN);
        String token = jwtUtil.generateToken(admin);
        assertThat(jwtUtil.extractRole(token)).isEqualTo("ADMIN");
    }

    @Test
    void generateToken_userRoleIsEncodedCorrectly() {
        User regularUser = buildUser(20L, "user", Role.USER);
        String token = jwtUtil.generateToken(regularUser);
        assertThat(jwtUtil.extractRole(token)).isEqualTo("USER");
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private User buildUser(Long id, String username, Role role) {
        return User.builder()
                .id(id)
                .username(username)
                .passwordHash("hashed")
                .role(role)
                .build();
    }

    /**
     * Builds a token that is already expired by setting expiry 1 second in the past.
     * Uses the same secret as the test JwtUtil so the signature is valid — only the
     * expiry check should fail.
     */
    private String buildExpiredToken(String username, Long userId, Role role) {
        io.jsonwebtoken.security.Keys keys = null; // unused — just for import clarity
        javax.crypto.SecretKey key = io.jsonwebtoken.security.Keys
                .hmacShaKeyFor(TEST_SECRET.getBytes(java.nio.charset.StandardCharsets.UTF_8));

        java.util.Date past = new java.util.Date(System.currentTimeMillis() - 2000);

        return io.jsonwebtoken.Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .claim("role", role.name())
                .issuedAt(new java.util.Date(System.currentTimeMillis() - 10000))
                .expiration(past)
                .signWith(key)
                .compact();
    }
}
