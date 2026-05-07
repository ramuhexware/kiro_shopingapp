package com.example.shop.product;

import com.example.shop.common.dto.CreateProductRequest;
import com.example.shop.common.dto.ProductDTO;
import com.example.shop.common.dto.UpdateProductRequest;
import com.example.shop.common.error.OptimisticLockingException;
import com.example.shop.common.error.ResourceNotFoundException;
import com.example.shop.common.mapper.ProductMapper;
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
public class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductMapper productMapper;

    @InjectMocks
    private ProductService productService;

    private Product sampleProduct;
    private ProductDTO sampleProductDTO;

    @BeforeEach
    void setUp() {
        sampleProduct = Product.builder()
                .id(1L)
                .sku("SKU-001")
                .name("Sample Product")
                .description("A sample product")
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
                .description("A sample product")
                .unitPrice(new BigDecimal("99.99"))
                .stockQuantity(10)
                .minStockLevel(2)
                .active(true)
                .version(0L)
                .build();
    }

    @Test
    void testCreateProduct_Success() {
        CreateProductRequest request = CreateProductRequest.builder()
                .sku("SKU-001")
                .name("Sample Product")
                .description("A sample product")
                .unitPrice(new BigDecimal("99.99"))
                .minStockLevel(2)
                .build();

        when(productRepository.findBySku("SKU-001")).thenReturn(Optional.empty());
        when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);
        when(productMapper.toDTO(sampleProduct)).thenReturn(sampleProductDTO);

        ProductDTO result = productService.createProduct(request);

        assertNotNull(result);
        assertEquals("SKU-001", result.getSku());
        verify(productRepository).findBySku("SKU-001");
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void testCreateProduct_DuplicateSku() {
        CreateProductRequest request = CreateProductRequest.builder()
                .sku("SKU-001")
                .name("Sample Product")
                .unitPrice(new BigDecimal("99.99"))
                .build();

        when(productRepository.findBySku("SKU-001")).thenReturn(Optional.of(sampleProduct));

        assertThrows(IllegalArgumentException.class, () -> productService.createProduct(request));
        verify(productRepository).findBySku("SKU-001");
    }

    @Test
    void testUpdateProduct_Success() {
        UpdateProductRequest request = UpdateProductRequest.builder()
                .name("Updated Product")
                .unitPrice(new BigDecimal("120.00"))
                .version(0L)
                .build();

        Product updatedProduct = sampleProduct;
        updatedProduct.setName("Updated Product");
        updatedProduct.setUnitPrice(new BigDecimal("120.00"));

        when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenReturn(updatedProduct);
        when(productMapper.toDTO(updatedProduct)).thenReturn(ProductDTO.builder()
                .id(1L)
                .name("Updated Product")
                .unitPrice(new BigDecimal("120.00"))
                .version(0L)
                .build());

        ProductDTO result = productService.updateProduct(1L, request);

        assertNotNull(result);
        assertEquals("Updated Product", result.getName());
        verify(productRepository).findById(1L);
    }

    @Test
    void testUpdateProduct_VersionConflict() {
        UpdateProductRequest request = UpdateProductRequest.builder()
                .name("Updated Product")
                .version(1L) // Wrong version
                .build();

        when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));

        assertThrows(OptimisticLockingException.class, () -> productService.updateProduct(1L, request));
        verify(productRepository).findById(1L);
    }

    @Test
    void testUpdateProduct_NotFound() {
        UpdateProductRequest request = UpdateProductRequest.builder()
                .name("Updated Product")
                .version(0L)
                .build();

        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.updateProduct(999L, request));
    }

    @Test
    void testToggleActive_Success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);
        when(productMapper.toDTO(sampleProduct)).thenReturn(sampleProductDTO);

        ProductDTO result = productService.toggleActive(1L);

        assertNotNull(result);
        verify(productRepository).findById(1L);
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void testSkuExists_True() {
        when(productRepository.findBySku("SKU-001")).thenReturn(Optional.of(sampleProduct));

        boolean exists = productService.skuExists("SKU-001");

        assertTrue(exists);
    }

    @Test
    void testSkuExists_False() {
        when(productRepository.findBySku("SKU-999")).thenReturn(Optional.empty());

        boolean exists = productService.skuExists("SKU-999");

        assertFalse(exists);
    }
}
