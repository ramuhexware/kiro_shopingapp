package com.example.shop.inventory;

import com.example.shop.common.dto.PurchaseRequest;
import com.example.shop.common.dto.PurchaseResponse;
import com.example.shop.common.dto.ProductDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000"})
public class InventoryController {

    private final InventoryService inventoryService;

    /**
     * POST /api/stock/purchase - Record stock purchase (stock-in). ADMIN only.
     */
    @PostMapping("/purchase")
    public ResponseEntity<ProductDTO> purchaseStock(
            @Valid @RequestBody PurchaseRequest request) {
        log.info("Recording purchase: productId={}, quantity={}", request.getProductId(), request.getQuantity());
        ProductDTO updated = inventoryService.purchaseStock(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(updated);
    }

    /**
     * GET /api/stock/purchases - Returns all stock purchase history. ADMIN only.
     */
    @GetMapping("/purchases")
    public ResponseEntity<List<PurchaseResponse>> getPurchaseHistory() {
        log.debug("Getting purchase history (ADMIN)");
        return ResponseEntity.ok(inventoryService.getPurchaseHistory());
    }
}
