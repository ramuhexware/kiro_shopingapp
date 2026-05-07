package com.example.shop.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Utility component for generating and parsing JWT tokens.
 * Tokens carry the user's identity claims (sub, userId, role) and expire after 8 hours.
 */
@Slf4j
@Component
public class JwtUtil {

    private static final long EXPIRY_MS = 8L * 60 * 60 * 1000; // 8 hours

    private static final String CLAIM_USER_ID = "userId";
    private static final String CLAIM_ROLE = "role";

    private final SecretKey secretKey;

    public JwtUtil(@Value("${app.jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generates a signed JWT for the given user.
     * The token contains {@code sub} (username), {@code userId}, and {@code role} claims
     * and expires after 8 hours.
     *
     * @param user the authenticated user
     * @return a compact, signed JWT string
     */
    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + EXPIRY_MS);

        return Jwts.builder()
                .subject(user.getUsername())
                .claim(CLAIM_USER_ID, user.getId())
                .claim(CLAIM_ROLE, user.getRole().name())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Parses and validates a JWT token.
     * Throws a {@link io.jsonwebtoken.JwtException} if the token is invalid or expired.
     *
     * @param token the compact JWT string
     * @return the validated {@link Claims}
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extracts the username ({@code sub} claim) from a token.
     *
     * @param token the compact JWT string
     * @return the username
     */
    public String extractUsername(String token) {
        return parseToken(token).getSubject();
    }

    /**
     * Extracts the user ID from a token.
     *
     * @param token the compact JWT string
     * @return the user ID
     */
    public Long extractUserId(String token) {
        return parseToken(token).get(CLAIM_USER_ID, Long.class);
    }

    /**
     * Extracts the role string from a token.
     *
     * @param token the compact JWT string
     * @return the role name (e.g. "ADMIN" or "USER")
     */
    public String extractRole(String token) {
        return parseToken(token).get(CLAIM_ROLE, String.class);
    }
}
