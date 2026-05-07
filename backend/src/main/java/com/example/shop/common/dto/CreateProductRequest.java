package com.example.shop.common.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateProductRequest {
    
    @NotBlank(message = "SKU is required")
    private String sku;
    
    @NotBlank(message = "Name is required")
    private String name;
    
    private String description;
    
    @NotNull(message = "Unit price is required")
    @Min(value = 0, message = "Unit price must be >= 0")
    private BigDecimal unitPrice;
    
    @Min(value = 0, message = "Min stock level must be >= 0")
    private Integer minStockLevel;

    @Min(value = 0, message = "Initial stock quantity must be >= 0")
    private Integer stockQuantity;
}
