package com.example.shop.sale;

import com.example.shop.common.dto.SaleRequest;
import com.example.shop.common.dto.SaleResponse;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
@Slf4j
public class SaleController {

    private final SaleService saleService;

    /**
     * POST /api/sales — Create a new sale.
     * Extracts the authenticated user's ID from the JWT claims stored in the
     * {@code Authentication} details by {@link com.example.shop.auth.JwtFilter}.
     */
    @PostMapping
    public ResponseEntity<SaleResponse> createSale(
            @Valid @RequestBody SaleRequest request,
            Authentication authentication) {
        Long userId = extractUserId(authentication);
        log.info("Creating sale with {} items for userId={}", request.getItems().size(), userId);
        SaleResponse response = saleService.createSale(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/sales/{id} — Get sale details.
     * USER can only access their own sale; ADMIN can access any sale.
     */
    @GetMapping("/{id}")
    public ResponseEntity<SaleResponse> getSale(
            @PathVariable Long id,
            Authentication authentication) {
        Long currentUserId = extractUserId(authentication);
        boolean isAdmin = isAdmin(authentication);
        log.debug("Getting sale id={} for userId={} isAdmin={}", id, currentUserId, isAdmin);
        SaleResponse response = saleService.getSaleById(id, currentUserId, isAdmin);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/sales/my-orders — Returns the current user's orders.
     * USER receives only their own sales; ADMIN receives all sales.
     */
    @GetMapping("/my-orders")
    public ResponseEntity<List<SaleResponse>> getMyOrders(Authentication authentication) {
        Long userId = extractUserId(authentication);
        boolean isAdmin = isAdmin(authentication);
        log.debug("Getting orders for userId={} isAdmin={}", userId, isAdmin);
        List<SaleResponse> response = isAdmin
                ? saleService.getAllSales()
                : saleService.getSalesByUser(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/sales — Returns all sales. ADMIN only (enforced by SecurityConfig).
     */
    @GetMapping
    public ResponseEntity<List<SaleResponse>> getAllSales() {
        log.debug("Getting all sales (ADMIN)");
        return ResponseEntity.ok(saleService.getAllSales());
    }

    // -------------------------------------------------------------------------
    // Helpers — extract claims stored by JwtFilter in authentication.getDetails()
    // -------------------------------------------------------------------------

    private Long extractUserId(Authentication authentication) {
        return ((Claims) authentication.getDetails()).get("userId", Long.class);
    }

    private boolean isAdmin(Authentication authentication) {
        String role = ((Claims) authentication.getDetails()).get("role", String.class);
        return "ADMIN".equals(role);
    }
}
