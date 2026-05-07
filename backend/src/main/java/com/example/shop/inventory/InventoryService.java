package com.example.shop.inventory;

import com.example.shop.common.dto.PurchaseRequest;
import com.example.shop.common.dto.PurchaseResponse;
import com.example.shop.common.dto.ProductDTO;
import com.example.shop.common.error.ResourceNotFoundException;
import com.example.shop.common.mapper.ProductMapper;
import com.example.shop.product.Product;
import com.example.shop.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final ProductRepository productRepository;
    private final PurchaseRepository purchaseRepository;
    private final ProductMapper productMapper;

    /**
     * Process stock purchase (stock-in).
     * Increments the product's stockQuantity and records the Purchase.
     */
    @Transactional
    public ProductDTO purchaseStock(PurchaseRequest request) {
        log.info("Processing purchase: productId={}, quantity={}", request.getProductId(), request.getQuantity());

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + request.getProductId()));

        if (request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        product.setStockQuantity(product.getStockQuantity() + request.getQuantity());
        Product saved = productRepository.save(product);

        purchaseRepository.save(Purchase.builder()
                .productId(request.getProductId())
                .quantity(request.getQuantity())
                .unitCost(request.getUnitCost())
                .build());

        log.info("Purchase recorded: productId={}, new stock={}", request.getProductId(), saved.getStockQuantity());
        return productMapper.toDTO(saved);
    }

    /**
     * Returns all stock purchase records ordered by date descending. ADMIN only.
     */
    @Transactional(readOnly = true)
    public List<PurchaseResponse> getPurchaseHistory() {
        return purchaseRepository.findAllByOrderByPurchasedAtDesc().stream()
                .map(p -> {
                    Product product = productRepository.findById(p.getProductId()).orElse(null);
                    return PurchaseResponse.builder()
                            .id(p.getId())
                            .productId(p.getProductId())
                            .productName(product != null ? product.getName() : "Unknown")
                            .productSku(product != null ? product.getSku() : "Unknown")
                            .quantity(p.getQuantity())
                            .unitCost(p.getUnitCost())
                            .purchasedAt(p.getPurchasedAt())
                            .build();
                })
                .toList();
    }
}
