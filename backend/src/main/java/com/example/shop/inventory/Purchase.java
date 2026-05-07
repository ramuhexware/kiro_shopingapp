package com.example.shop.inventory;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "purchases", indexes = {
    @Index(name = "idx_product_id", columnList = "product_id"),
    @Index(name = "idx_purchased_at", columnList = "purchased_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(precision = 10, scale = 2)
    private BigDecimal unitCost;

    @Column(nullable = false, updatable = false)
    private Instant purchasedAt;

    @PrePersist
    protected void onCreate() {
        if (purchasedAt == null) {
            purchasedAt = Instant.now();
        }
    }
}
