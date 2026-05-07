package com.example.shop.sale;

import com.example.shop.common.dto.SaleRequest;
import com.example.shop.common.dto.SaleResponse;
import com.example.shop.common.error.InsufficientStockException;
import com.example.shop.common.error.ResourceNotFoundException;
import com.example.shop.product.Product;
import com.example.shop.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;

    /**
     * Create a sale with stock validation and deduction
     * All stock operations are atomic within this transaction
     */
    @Transactional
    @SuppressWarnings("null")
    public SaleResponse createSale(SaleRequest request, Long userId) {
        log.info("Creating sale with {} items", request.getItems().size());

        // Validate all items exist and have sufficient stock
        Map<Long, Product> productCache = new HashMap<>();
        List<SaleValidation> validations = new ArrayList<>();

        for (SaleRequest.SaleItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById((Long) itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found with ID: " + itemRequest.getProductId()));

            // Validate product is active
            if (!product.getActive()) {
                throw new IllegalArgumentException(
                        "Cannot sell inactive product: " + product.getName());
            }

            // Validate quantity
            if (itemRequest.getQuantity() == null || itemRequest.getQuantity() <= 0) {
                throw new IllegalArgumentException("Quantity must be greater than 0");
            }

            // Validate sufficient stock
            if (product.getStockQuantity() < itemRequest.getQuantity()) {
                throw new InsufficientStockException(
                        "Insufficient stock for product '" + product.getName() + "': " +
                        "requested " + itemRequest.getQuantity() + ", available " + product.getStockQuantity());
            }

            productCache.put(product.getId(), product);
            validations.add(new SaleValidation(product, itemRequest));
        }

        // All validations passed; now proceed with stock deduction and sale creation
        Sale sale = Sale.builder()
                .totalAmount(BigDecimal.ZERO)
                .userId(userId)
                .items(new ArrayList<>())
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (SaleValidation validation : validations) {
            Product product = validation.product;
            SaleRequest.SaleItemRequest itemRequest = validation.itemRequest;

            // Determine unit price
            BigDecimal unitPrice = itemRequest.getUnitPrice() != null 
                    ? itemRequest.getUnitPrice() 
                    : product.getUnitPrice();

            // Calculate line total
            BigDecimal lineTotal = unitPrice.multiply(new BigDecimal(itemRequest.getQuantity()));
            totalAmount = totalAmount.add(lineTotal);

            // Create SaleItem
            SaleItem saleItem = SaleItem.builder()
                    .sale(sale)
                    .productId(product.getId())
                    .quantity(itemRequest.getQuantity())
                    .unitPrice(unitPrice)
                    .lineTotal(lineTotal)
                    .build();

            sale.getItems().add(saleItem);

            // Deduct from stock
            product.setStockQuantity(product.getStockQuantity() - itemRequest.getQuantity());
            productRepository.save(product);

            log.debug("Stock deducted for product ID: {}, remaining: {}", 
                    product.getId(), product.getStockQuantity());
        }

        sale.setTotalAmount(totalAmount);
        Sale savedSale = saleRepository.save(sale);

        log.info("Sale created with ID: {}, total amount: {}", savedSale.getId(), totalAmount);

        return mapToSaleResponse(savedSale);
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public SaleResponse getSaleById(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with ID: " + id));
        return mapToSaleResponse(sale);
    }

    /**
     * Get a sale by ID with ownership check.
     * ADMIN bypasses the check; USER can only access their own sales.
     */
    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public SaleResponse getSaleById(Long id, Long currentUserId, boolean isAdmin) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with ID: " + id));

        if (!isAdmin && !sale.getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("Access denied: sale does not belong to the current user");
        }

        return mapToSaleResponse(sale);
    }

    /**
     * Returns all sales belonging to the given user, ordered by soldAt descending.
     * Used for the my-orders endpoint.
     */
    @Transactional(readOnly = true)
    public List<SaleResponse> getSalesByUser(Long userId) {
        return saleRepository.findByUserIdOrderBySoldAtDesc(userId).stream()
                .map(this::mapToSaleResponse)
                .toList();
    }

    /**
     * Returns all sales ordered by soldAt descending. ADMIN only.
     */
    @Transactional(readOnly = true)
    public List<SaleResponse> getAllSales() {
        return saleRepository.findAllByOrderBySoldAtDesc().stream()
                .map(this::mapToSaleResponse)
                .toList();
    }

    /**
     * Map Sale entity to SaleResponse DTO
     */
    private SaleResponse mapToSaleResponse(Sale sale) {
        List<SaleResponse.SaleItemResponse> itemResponses = sale.getItems().stream()
                .map(item -> SaleResponse.SaleItemResponse.builder()
                        .productId(item.getProductId())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .lineTotal(item.getLineTotal())
                        .build())
                .toList();

        return SaleResponse.builder()
                .saleId(sale.getId())
                .userId(sale.getUserId())
                .soldAt(sale.getSoldAt())
                .totalAmount(sale.getTotalAmount())
                .items(itemResponses)
                .build();
    }

    /**
     * Internal class for validation aggregation
     */
    private static class SaleValidation {
        Product product;
        SaleRequest.SaleItemRequest itemRequest;

        SaleValidation(Product product, SaleRequest.SaleItemRequest itemRequest) {
            this.product = product;
            this.itemRequest = itemRequest;
        }
    }
}
