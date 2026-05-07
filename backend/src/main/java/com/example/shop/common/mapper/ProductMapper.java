package com.example.shop.common.mapper;

import com.example.shop.common.dto.ProductDTO;
import com.example.shop.product.Product;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProductMapper {
    
    ProductDTO toDTO(Product product);
    
    Product toEntity(ProductDTO dto);
}
