# Product Overview

Shop Inventory Management System with Point of Sale (POS) functionality.

## Purpose

A full-stack inventory and sales management application for retail shops. Enables product catalog management, stock tracking, and sales transactions with real-time inventory updates.

## Core Features

- **Product Management**: Create, update, and search products with SKU-based identification
- **Inventory Control**: Track stock levels, minimum stock thresholds, and purchase history
- **Sales/POS**: Process multi-item sales with automatic stock deduction
- **Optimistic Locking**: Prevent concurrent update conflicts on product records
- **Stock Validation**: Ensure sufficient inventory before completing sales

## Key Business Rules

- Products must have unique SKUs
- Stock quantity cannot go negative (validated before sales)
- Inactive products cannot be sold
- All sales are atomic transactions (all items succeed or all fail)
- Version-based optimistic locking prevents lost updates
