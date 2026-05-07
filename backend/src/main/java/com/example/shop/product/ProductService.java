package com.example.shop.product;

import com.example.shop.common.dto.CreateProductRequest;
import com.example.shop.common.dto.ProductDTO;
import com.example.shop.common.dto.UpdateProductRequest;
import com.example.shop.common.error.OptimisticLockingException;
import com.example.shop.common.error.ResourceNotFoundException;
import com.example.shop.common.mapper.ProductMapper;
import com.example.shop.inventory.Purchase;
import com.example.shop.inventory.PurchaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final PurchaseRepository purchaseRepository;

    /**
     * Create a new product. If an initial stockQuantity > 0 is provided,
     * a Purchase record is created so it appears in purchase history.
     */
    @Transactional
    public ProductDTO createProduct(CreateProductRequest request) {
        log.info("Creating product with SKU: {}", request.getSku());

        if (productRepository.findBySku(request.getSku()).isPresent()) {
            throw new IllegalArgumentException("Product with SKU '" + request.getSku() + "' already exists");
        }

        int initialStock = request.getStockQuantity() != null ? request.getStockQuantity() : 0;

        Product product = Product.builder()
                .sku(request.getSku())
                .name(request.getName())
                .description(request.getDescription())
                .unitPrice(request.getUnitPrice())
                .minStockLevel(request.getMinStockLevel() != null ? request.getMinStockLevel() : 0)
                .stockQuantity(initialStock)
                .active(true)
                .build();

        Product saved = productRepository.save(product);
        log.info("Product created with ID: {}", saved.getId());

        // Record initial stock as a purchase entry so it appears in purchase history
        if (initialStock > 0) {
            purchaseRepository.save(Purchase.builder()
                    .productId(saved.getId())
                    .quantity(initialStock)
                    .unitCost(null)
                    .build());
            log.info("Initial stock purchase recorded for product ID: {}, qty: {}", saved.getId(), initialStock);
        }

        return productMapper.toDTO(saved);
    }

    /**
     * Get product by ID
     */
    @Transactional(readOnly = true)
    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
        return productMapper.toDTO(product);
    }

    /**
     * Update product with optimistic locking
     */
    @Transactional
    public ProductDTO updateProduct(Long id, UpdateProductRequest request) {
        log.info("Updating product ID: {} with version: {}", id, request.getVersion());

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));

        if (!product.getVersion().equals(request.getVersion())) {
            log.warn("Version mismatch for product ID: {}. Current: {}, Request: {}",
                    id, product.getVersion(), request.getVersion());
            throw new OptimisticLockingException("Version conflict: product has been updated. Current version: "
                    + product.getVersion() + ", your version: " + request.getVersion());
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            product.setName(request.getName());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getUnitPrice() != null) {
            product.setUnitPrice(request.getUnitPrice());
        }
        if (request.getMinStockLevel() != null) {
            product.setMinStockLevel(request.getMinStockLevel());
        }
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }

        Product updated = productRepository.save(product);
        log.info("Product ID: {} updated successfully", id);
        return productMapper.toDTO(updated);
    }

    /**
     * Toggle active status
     */
    @Transactional
    public ProductDTO toggleActive(Long id) {
        log.info("Toggling active status for product ID: {}", id);

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));

        product.setActive(!product.getActive());
        Product updated = productRepository.save(product);
        log.info("Product ID: {} active status toggled to {}", id, updated.getActive());
        return productMapper.toDTO(updated);
    }

    /**
     * Search products by name/sku with optional active filter
     */
    @Transactional(readOnly = true)
    public List<ProductDTO> search(String query, Boolean active) {
        log.debug("Searching products with query: {}, active: {}", query, active);

        List<Product> results;
        if (query == null || query.isBlank()) {
            results = active == null ? productRepository.findAll() : productRepository.findAllByActive(active);
        } else {
            results = active == null
                    ? productRepository.searchBySkuOrName(query)
                    : productRepository.searchBySkuOrNameAndActive(query, active);
        }

        return results.stream().map(productMapper::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean skuExists(String sku) {
        return productRepository.findBySku(sku).isPresent();
    }

    @Transactional(readOnly = true)
    public Optional<Product> findBySku(String sku) {
        return productRepository.findBySku(sku);
    }
}
