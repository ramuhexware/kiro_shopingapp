package com.example.shop.auth;

/**
 * Response payload returned after a successful login.
 * Contains the signed JWT, the authenticated username, and the user's role.
 */
public record AuthResponse(
        String token,
        String username,
        String role
) {}
