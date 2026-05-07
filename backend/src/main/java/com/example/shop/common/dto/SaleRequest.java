package com.example.shop.common.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleRequest {
    
    @lombok.NonNull
    private List<SaleItemRequest> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SaleItemRequest {
        private Long productId;
        private Integer quantity;
        private BigDecimal unitPrice; // Optional override
    }
}
