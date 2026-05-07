package com.example.shop.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for the login endpoint.
 */
public record LoginRequest(
        @NotBlank String username,
        @NotBlank String password
) {}
