package com.example.shop.auth;

import net.jqwik.api.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Property-based tests for BCrypt password hashing.
 *
 * Property 3: BCrypt password hashing is non-reversible and verifiable.
 *
 * For any plaintext password, encoding it with BCryptPasswordEncoder SHALL produce
 * a hash that (a) does not equal the plaintext, and (b) passes
 * BCryptPasswordEncoder.matches(plaintext, hash).
 *
 * Validates: Requirements 1.1, 4.4
 */
public class PasswordEncoderTest {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    /**
     * Property 3: BCrypt password hashing is non-reversible and verifiable.
     *
     * For any arbitrary plaintext string:
     * 1. The encoded hash must differ from the plaintext (non-reversible / one-way).
     * 2. BCryptPasswordEncoder.matches(plaintext, hash) must return true (verifiable).
     *
     * Validates: Requirements 1.1, 4.4
     */
    @Property(tries = 200)
    void property_bcryptHashIsNonReversibleAndVerifiable(
            @ForAll String plaintext
    ) {
        String hash = encoder.encode(plaintext);

        // (a) The hash must not equal the plaintext — BCrypt is a one-way function
        assertNotEquals(
                plaintext,
                hash,
                "BCrypt hash must differ from the plaintext input"
        );

        // (b) matches() must confirm the plaintext against its own hash
        assertTrue(
                encoder.matches(plaintext, hash),
                "BCryptPasswordEncoder.matches() must return true for the original plaintext"
        );
    }
}
