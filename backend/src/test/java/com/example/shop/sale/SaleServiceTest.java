package com.example.shop.sale;

import com.example.shop.common.dto.SaleRequest;
import com.example.shop.common.dto.SaleResponse;
import com.example.shop.common.error.InsufficientStockException;
import com.example.shop.common.error.ResourceNotFoundException;
import com.example.shop.product.Product;
import com.example.shop.product.ProductRepository;
import net.jqwik.api.*;
import net.jqwik.api.constraints.LongRange;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class SaleServiceTest {

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private SaleService saleService;

    private Product sampleProduct;
    private Product inactiveProduct;

    @BeforeEach
    void setUp() {
        sampleProduct = Product.builder()
                .id(1L)
                .sku("SKU-001")
                .name("Sample Product")
                .unitPrice(new BigDecimal("99.99"))
                .stockQuantity(20)
                .minStockLevel(2)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .version(0L)
                .build();

        inactiveProduct = Product.builder()
                .id(2L)
                .sku("SKU-002")
                .name("Inactive Product")
                .unitPrice(new BigDecimal("50.00"))
                .stockQuantity(10)
                .minStockLevel(2)
                .active(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .version(0L)
                .build();
    }

    @Test
    void testCreateSale_Success() {
        List<SaleRequest.SaleItemRequest> items = new ArrayList<>();
        items.add(SaleRequest.SaleItemRequest.builder()
                .productId(1L)
                .quantity(5)
                .build());

        SaleRequest request = SaleRequest.builder()
                .items(items)
                .build();

        Sale sale = Sale.builder()
                .id(1L)
                .totalAmount(new BigDecimal("499.95"))
                .items(new ArrayList<>())
                .build();

        when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);
        when(saleRepository.save(any(Sale.class))).thenReturn(sale);

        SaleResponse response = saleService.createSale(request, null);

        assertNotNull(response);
        assertEquals(1L, response.getSaleId());
        verify(productRepository).findById(1L);
        verify(productRepository).save(any(Product.class));
        verify(saleRepository).save(any(Sale.class));
    }

    @Test
    void testCreateSale_InsufficientStock() {
        List<SaleRequest.SaleItemRequest> items = new ArrayList<>();
        items.add(SaleRequest.SaleItemRequest.builder()
                .productId(1L)
                .quantity(50) // More than available stock
                .build());

        SaleRequest request = SaleRequest.builder()
                .items(items)
                .build();

        when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));

        assertThrows(InsufficientStockException.class, () -> saleService.createSale(request, null));
    }

    @Test
    void testCreateSale_ProductNotActive() {
        List<SaleRequest.SaleItemRequest> items = new ArrayList<>();
        items.add(SaleRequest.SaleItemRequest.builder()
                .productId(2L)
                .quantity(5)
                .build());

        SaleRequest request = SaleRequest.builder()
                .items(items)
                .build();

        when(productRepository.findById(2L)).thenReturn(Optional.of(inactiveProduct));

        assertThrows(IllegalArgumentException.class, () -> saleService.createSale(request, null));
    }

    @Test
    void testCreateSale_ProductNotFound() {
        List<SaleRequest.SaleItemRequest> items = new ArrayList<>();
        items.add(SaleRequest.SaleItemRequest.builder()
                .productId(999L)
                .quantity(5)
                .build());

        SaleRequest request = SaleRequest.builder()
                .items(items)
                .build();

        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> saleService.createSale(request, null));
    }

    @Test
    void testGetSaleById_Success() {
        Sale sale = Sale.builder()
                .id(1L)
                .soldAt(Instant.now())
                .totalAmount(new BigDecimal("499.95"))
                .items(new ArrayList<>())
                .build();

        when(saleRepository.findById(1L)).thenReturn(Optional.of(sale));

        SaleResponse response = saleService.getSaleById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getSaleId());
    }

    @Test
    void testGetSaleById_NotFound() {
        when(saleRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> saleService.getSaleById(999L));
    }

    // -------------------------------------------------------------------------
    // Ownership checks for getSaleById(id, currentUserId, isAdmin)
    // Validates: Requirements 2.5, 2.6
    // -------------------------------------------------------------------------

    @Test
    void testGetSaleById_UserAccessingOwnSale_Succeeds() {
        Long userId = 42L;
        Sale sale = Sale.builder()
                .id(1L)
                .userId(userId)
                .soldAt(Instant.now())
                .totalAmount(new BigDecimal("99.99"))
                .items(new ArrayList<>())
                .build();

        when(saleRepository.findById(1L)).thenReturn(Optional.of(sale));

        SaleResponse response = saleService.getSaleById(1L, userId, false);

        assertNotNull(response);
        assertEquals(1L, response.getSaleId());
        assertEquals(userId, response.getUserId());
    }

    @Test
    void testGetSaleById_UserAccessingAnotherUsersSale_ThrowsAccessDeniedException() {
        Long ownerId = 42L;
        Long requestingUserId = 99L;
        Sale sale = Sale.builder()
                .id(1L)
                .userId(ownerId)
                .soldAt(Instant.now())
                .totalAmount(new BigDecimal("99.99"))
                .items(new ArrayList<>())
                .build();

        when(saleRepository.findById(1L)).thenReturn(Optional.of(sale));

        assertThrows(AccessDeniedException.class,
                () -> saleService.getSaleById(1L, requestingUserId, false));
    }

    @Test
    void testGetSaleById_AdminAccessingAnySale_Succeeds() {
        Long ownerId = 42L;
        Long adminUserId = 1L;
        Sale sale = Sale.builder()
                .id(1L)
                .userId(ownerId)
                .soldAt(Instant.now())
                .totalAmount(new BigDecimal("99.99"))
                .items(new ArrayList<>())
                .build();

        when(saleRepository.findById(1L)).thenReturn(Optional.of(sale));

        // Admin (isAdmin=true) should access any sale regardless of ownership
        SaleResponse response = saleService.getSaleById(1L, adminUserId, true);

        assertNotNull(response);
        assertEquals(1L, response.getSaleId());
        assertEquals(ownerId, response.getUserId());
    }

    // -------------------------------------------------------------------------
    // Property 4: Sale ownership is preserved end-to-end
    // Validates: Requirements 2.7, 3.2
    // -------------------------------------------------------------------------

    /**
     * Property 4 — Sale ownership is preserved end-to-end.
     * For any authenticated user who creates a sale, the persisted Sale entity
     * SHALL have a userId equal to that user's ID.
     */
    @Property(tries = 200)
    void saleOwnershipIsPreservedEndToEnd(
            @ForAll @LongRange(min = 1, max = Long.MAX_VALUE) long userId) {

        // Create fresh mocks per trial — jqwik doesn't use @Mock injection
        SaleRepository mockSaleRepo = mock(SaleRepository.class);
        ProductRepository mockProductRepo = mock(ProductRepository.class);
        SaleService service = new SaleService(mockSaleRepo, mockProductRepo);

        Product product = Product.builder()
                .id(1L)
                .sku("SKU-PROP4")
                .name("Property Test Product")
                .unitPrice(new BigDecimal("10.00"))
                .stockQuantity(100)
                .minStockLevel(1)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .version(0L)
                .build();

        when(mockProductRepo.findById(1L)).thenReturn(Optional.of(product));
        when(mockProductRepo.save(any(Product.class))).thenReturn(product);

        // Capture the Sale passed to saleRepository.save()
        ArgumentCaptor<Sale> saleCaptor = ArgumentCaptor.forClass(Sale.class);
        Sale savedSale = Sale.builder()
                .id(42L)
                .userId(userId)
                .totalAmount(new BigDecimal("10.00"))
                .items(new ArrayList<>())
                .build();
        when(mockSaleRepo.save(saleCaptor.capture())).thenReturn(savedSale);

        SaleRequest request = SaleRequest.builder()
                .items(List.of(SaleRequest.SaleItemRequest.builder()
                        .productId(1L)
                        .quantity(1)
                        .build()))
                .build();

        SaleResponse response = service.createSale(request, userId);

        // The Sale passed to the repository must carry the correct userId
        Sale capturedSale = saleCaptor.getValue();
        assertEquals(userId, capturedSale.getUserId(),
                "The persisted Sale must have userId equal to the authenticated user's ID");

        // The response DTO must also reflect the userId
        assertEquals(userId, response.getUserId(),
                "SaleResponse.userId must equal the authenticated user's ID");
    }

    // -------------------------------------------------------------------------
    // Property 5: My-orders returns only the requesting user's sales
    // Validates: Requirements 2.7, 3.2
    // -------------------------------------------------------------------------

    /**
     * Property 5 — My-orders returns only the requesting user's sales.
     * For any user, getSalesByUser(userId) SHALL return exactly the sales whose
     * userId matches — no more, no less.
     */
    @Property(tries = 200)
    void myOrdersReturnsOnlyRequestingUsersSales(
            @ForAll("salesWithRandomUserIds") List<Sale> allSales,
            @ForAll @LongRange(min = 1, max = 5) long targetUserId) {

        SaleRepository mockSaleRepo = mock(SaleRepository.class);
        ProductRepository mockProductRepo = mock(ProductRepository.class);
        SaleService service = new SaleService(mockSaleRepo, mockProductRepo);

        List<Sale> expectedSales = allSales.stream()
                .filter(s -> targetUserId == s.getUserId())
                .collect(Collectors.toList());

        when(mockSaleRepo.findByUserIdOrderBySoldAtDesc(targetUserId))
                .thenReturn(expectedSales);

        List<SaleResponse> result = service.getSalesByUser(targetUserId);

        assertEquals(expectedSales.size(), result.size(),
                "getSalesByUser must return exactly the sales belonging to the target user");

        for (SaleResponse response : result) {
            assertEquals(targetUserId, response.getUserId(),
                    "Every SaleResponse returned by getSalesByUser must have userId == targetUserId");
        }
    }

    @Provide
    Arbitrary<List<Sale>> salesWithRandomUserIds() {
        Arbitrary<Long> userIdArb = Arbitraries.longs().between(1L, 5L);
        Arbitrary<Sale> saleArb = userIdArb.map(uid -> Sale.builder()
                .id(uid * 100 + Arbitraries.longs().between(1L, 99L).sample())
                .userId(uid)
                .totalAmount(new BigDecimal("50.00"))
                .soldAt(Instant.now())
                .items(new ArrayList<>())
                .build());
        return saleArb.list().ofMinSize(0).ofMaxSize(20);
    }
}
