package com.example.shop.product;

import com.example.shop.common.dto.CreateProductRequest;
import com.example.shop.common.dto.ProductDTO;
import com.example.shop.common.dto.UpdateProductRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000"})
public class ProductController {

    private final ProductService productService;

    /**
     * GET /api/products - List all products with optional search and active filter
     */
    @GetMapping
    public ResponseEntity<List<ProductDTO>> listProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active) {
        log.debug("Listing products with search: {}, active: {}", search, active);
        List<ProductDTO> products = productService.search(search, active);
        return ResponseEntity.ok(products);
    }

    /**
     * GET /api/products/{id} - Get product details
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProduct(@PathVariable Long id) {
        log.debug("Getting product with ID: {}", id);
        ProductDTO product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    /**
     * POST /api/products - Create a new product
     */
    @PostMapping
    public ResponseEntity<ProductDTO> createProduct(
            @Valid @RequestBody CreateProductRequest request) {
        log.info("Creating product with SKU: {}", request.getSku());
        ProductDTO created = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/products/{id} - Update product with optimistic locking
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProductDTO> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductRequest request) {
        log.info("Updating product ID: {}", id);
        ProductDTO updated = productService.updateProduct(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * POST /api/products/{id}/toggle-active - Toggle active status
     */
    @PostMapping("/{id}/toggle-active")
    public ResponseEntity<ProductDTO> toggleActive(@PathVariable Long id) {
        log.info("Toggling active status for product ID: {}", id);
        ProductDTO updated = productService.toggleActive(id);
        return ResponseEntity.ok(updated);
    }

    /**
     * GET /api/products/exists - Check if SKU exists
     */
    @GetMapping("/exists")
    public ResponseEntity<Boolean> skuExists(@RequestParam String sku) {
        log.debug("Checking if SKU exists: {}", sku);
        boolean exists = productService.skuExists(sku);
        return ResponseEntity.ok(exists);
    }
}
