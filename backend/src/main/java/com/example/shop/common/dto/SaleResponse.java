package com.example.shop.common.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleResponse {
    
    private Long saleId;
    private Long userId;
    private Instant soldAt;
    private BigDecimal totalAmount;
    private List<SaleItemResponse> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SaleItemResponse {
        private Long productId;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
    }
}
