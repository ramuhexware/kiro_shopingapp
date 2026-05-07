package com.example.shop.auth;

import com.example.shop.common.error.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration for the Shop Inventory API.
 * Configures stateless JWT-based authentication, CSRF disabled,
 * and the full authorization matrix for all endpoints.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final ObjectMapper objectMapper;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF — stateless REST API
            .csrf(AbstractHttpConfigurer::disable)

            // Disable frame options so H2 console works in iframes
            .headers(headers -> headers.frameOptions(frame -> frame.disable()))

            // Stateless session — no HTTP session created
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Authorization matrix
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/forgot-password").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/reset-password").permitAll()
                .requestMatchers("/h2-console/**").permitAll()

                // ADMIN only
                .requestMatchers(HttpMethod.POST, "/api/products").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/products/{id}").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/products/{id}/toggle-active").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/stock/purchase").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/stock/purchases").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/sales").hasRole("ADMIN")

                // ADMIN or USER
                .requestMatchers(HttpMethod.GET, "/api/products").hasAnyRole("ADMIN", "USER")
                .requestMatchers(HttpMethod.GET, "/api/products/{id}").hasAnyRole("ADMIN", "USER")
                .requestMatchers(HttpMethod.POST, "/api/sales").hasAnyRole("ADMIN", "USER")
                .requestMatchers(HttpMethod.GET, "/api/sales/{id}").hasAnyRole("ADMIN", "USER")
                .requestMatchers(HttpMethod.GET, "/api/sales/my-orders").hasAnyRole("ADMIN", "USER")

                // Everything else requires authentication
                .anyRequest().authenticated()
            )

            // 401 handler — returns JSON ErrorResponse instead of default HTML
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    ErrorResponse errorResponse = new ErrorResponse(
                            HttpStatus.UNAUTHORIZED.value(),
                            "UNAUTHORIZED",
                            "Authentication required"
                    );
                    response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
                })
                // 403 handler — returns JSON ErrorResponse instead of default HTML
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    ErrorResponse errorResponse = new ErrorResponse(
                            HttpStatus.FORBIDDEN.value(),
                            "FORBIDDEN",
                            "Access denied"
                    );
                    response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
                })
            )

            // Register JwtFilter before the standard username/password filter
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
