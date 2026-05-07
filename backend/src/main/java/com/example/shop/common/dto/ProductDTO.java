package com.example.shop.common.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDTO {
    private Long id;
    private String sku;
    private String name;
    private String description;
    private BigDecimal unitPrice;
    private Integer stockQuantity;
    private Integer minStockLevel;
    private Boolean active;
    private Long version;
    private Instant createdAt;
    private Instant updatedAt;
}
