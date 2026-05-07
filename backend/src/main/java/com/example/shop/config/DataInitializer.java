package com.example.shop.config;

import com.example.shop.auth.Role;
import com.example.shop.auth.User;
import com.example.shop.auth.UserRepository;
import com.example.shop.inventory.Purchase;
import com.example.shop.inventory.PurchaseRepository;
import com.example.shop.product.Product;
import com.example.shop.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    @Bean
    @SuppressWarnings("null")
    public CommandLineRunner initializeData(ProductRepository productRepository,
                                            PurchaseRepository purchaseRepository,
                                            UserRepository userRepository,
                                            PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed admin user
            if (userRepository.findByUsername("admin").isEmpty()) {
                userRepository.save(User.builder()
                        .username("admin")
                        .email("admin@shop.com")
                        .passwordHash(passwordEncoder.encode("admin123"))
                        .role(Role.ADMIN)
                        .build());
                log.info("Seeded admin user");
            }

            // Seed regular user
            if (userRepository.findByUsername("user").isEmpty()) {
                userRepository.save(User.builder()
                        .username("user")
                        .email("user@shop.com")
                        .passwordHash(passwordEncoder.encode("user123"))
                        .role(Role.USER)
                        .build());
                log.info("Seeded user account");
            }

            if (productRepository.count() > 0) {
                log.info("Database already populated with products");
                return;
            }

            log.info("Seeding database with sample products...");

            List<Product> products = List.of(
                Product.builder().sku("TECH-001").name("Professional Laptop")
                    .description("High-performance laptop for development and design")
                    .unitPrice(new BigDecimal("1299.99")).stockQuantity(15).minStockLevel(2).active(true).build(),
                Product.builder().sku("TECH-002").name("Wireless Mouse")
                    .description("Ergonomic wireless mouse with USB receiver")
                    .unitPrice(new BigDecimal("29.99")).stockQuantity(50).minStockLevel(5).active(true).build(),
                Product.builder().sku("TECH-003").name("Mechanical Keyboard")
                    .description("RGB backlit mechanical keyboard, Blue switches")
                    .unitPrice(new BigDecimal("129.99")).stockQuantity(25).minStockLevel(3).active(true).build(),
                Product.builder().sku("TECH-004").name("4K Monitor")
                    .description("27-inch 4K Ultra HD LED monitor with USB-C")
                    .unitPrice(new BigDecimal("499.99")).stockQuantity(10).minStockLevel(1).active(true).build(),
                Product.builder().sku("CABLE-001").name("USB-C Cable")
                    .description("Fast charging USB-C cable, 2 meters")
                    .unitPrice(new BigDecimal("12.99")).stockQuantity(100).minStockLevel(10).active(true).build(),
                Product.builder().sku("ACC-001").name("Adjustable Laptop Stand")
                    .description("Aluminum laptop stand, adjustable height")
                    .unitPrice(new BigDecimal("49.99")).stockQuantity(30).minStockLevel(2).active(true).build(),
                Product.builder().sku("TECH-005").name("7-Port USB Hub")
                    .description("USB 3.0 hub with power adapter")
                    .unitPrice(new BigDecimal("39.99")).stockQuantity(20).minStockLevel(2).active(true).build(),
                Product.builder().sku("TECH-006").name("1080p Webcam")
                    .description("Full HD webcam with microphone and auto focus")
                    .unitPrice(new BigDecimal("59.99")).stockQuantity(18).minStockLevel(2).active(true).build()
            );

            for (Product p : products) {
                Product saved = productRepository.save(p);
                // Record initial stock as a purchase entry so it appears in purchase history
                purchaseRepository.save(Purchase.builder()
                        .productId(saved.getId())
                        .quantity(saved.getStockQuantity())
                        .unitCost(null)
                        .build());
            }

            log.info("Successfully seeded 8 products with initial purchase records");
        };
    }
}
