package com.example.shop.auth;

/**
 * Response payload for the forgot-password endpoint.
 * In production the token would be sent via email; here it is returned
 * directly so the frontend can drive the reset flow without SMTP setup.
 */
public record ForgotPasswordResponse(
        String resetToken,
        String message
) {}
