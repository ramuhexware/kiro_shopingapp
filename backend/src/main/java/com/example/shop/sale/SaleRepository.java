package com.example.shop.sale;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findByUserIdOrderBySoldAtDesc(Long userId);

    List<Sale> findAllByOrderBySoldAtDesc();
}
