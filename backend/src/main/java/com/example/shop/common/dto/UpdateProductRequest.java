package com.example.shop.common.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProductRequest {
    
    private String name;
    private String description;
    
    @Min(value = 0, message = "Unit price must be >= 0")
    private BigDecimal unitPrice;
    
    @Min(value = 0, message = "Min stock level must be >= 0")
    private Integer minStockLevel;
    
    private Boolean active;
    
    @NotNull(message = "Version is required for updates (optimistic locking)")
    private Long version;
}
