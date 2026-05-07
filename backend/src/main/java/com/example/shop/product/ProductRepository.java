package com.example.shop.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    Optional<Product> findBySku(String sku);
    
    @Query("SELECT p FROM Product p WHERE " +
           "LOWER(p.sku) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Product> searchBySkuOrName(@Param("q") String q);
    
    @Query("SELECT p FROM Product p WHERE " +
           "(LOWER(p.sku) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))) " +
           "AND (:active IS NULL OR p.active = :active)")
    List<Product> searchBySkuOrNameAndActive(@Param("q") String q, @Param("active") Boolean active);
    
    @Query("SELECT p FROM Product p WHERE :active IS NULL OR p.active = :active")
    List<Product> findAllByActive(@Param("active") Boolean active);
}
