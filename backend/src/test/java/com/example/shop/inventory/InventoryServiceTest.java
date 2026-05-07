package com.example.shop.inventory;

import com.example.shop.common.dto.PurchaseRequest;
import com.example.shop.common.dto.ProductDTO;
import com.example.shop.common.error.ResourceNotFoundException;
import com.example.shop.common.mapper.ProductMapper;
import com.example.shop.product.Product;
import com.example.shop.product.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class InventoryServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private PurchaseRepository purchaseRepository;

    @Mock
    private ProductMapper productMapper;

    @InjectMocks
    private InventoryService inventoryService;

    private Product sampleProduct;
    private ProductDTO sampleProductDTO;

    @BeforeEach
    void setUp() {
        sampleProduct = Product.builder()
                .id(1L)
                .sku("SKU-001")
                .name("Sample Product")
                .unitPrice(new BigDecimal("99.99"))
                .stockQuantity(10)
                .minStockLevel(2)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .version(0L)
                .build();

        sampleProductDTO = ProductDTO.builder()
                .id(1L)
                .sku("SKU-001")
                .name("Sample Product")
                .unitPrice(new BigDecimal("99.99"))
                .stockQuantity(15)
                .minStockLevel(2)
                .active(true)
                .version(0L)
                .build();
    }

    @Test
    void testPurchaseStock_Success() {
        PurchaseRequest request = PurchaseRequest.builder()
                .productId(1L)
                .quantity(5)
                .unitCost(new BigDecimal("50.00"))
                .build();

        Product updatedProduct = sampleProduct;
        updatedProduct.setStockQuantity(15);

        when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenReturn(updatedProduct);
        when(purchaseRepository.save(any(Purchase.class))).thenReturn(new Purchase());
        when(productMapper.toDTO(updatedProduct)).thenReturn(sampleProductDTO);

        ProductDTO result = inventoryService.purchaseStock(request);

        assertNotNull(result);
        verify(productRepository).findById(1L);
        verify(productRepository).save(any(Product.class));
        verify(purchaseRepository).save(any(Purchase.class));
    }

    @Test
    void testPurchaseStock_ProductNotFound() {
        PurchaseRequest request = PurchaseRequest.builder()
                .productId(999L)
                .quantity(5)
                .build();

        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> inventoryService.purchaseStock(request));
    }

    @Test
    void testPurchaseStock_InvalidQuantity() {
        PurchaseRequest request = PurchaseRequest.builder()
                .productId(1L)
                .quantity(-1)
                .build();

        when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));

        assertThrows(IllegalArgumentException.class, () -> inventoryService.purchaseStock(request));
    }
}
