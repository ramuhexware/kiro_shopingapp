import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ApiService, ProductDTO, SaleRequest, SaleResponse } from '../../../core/services/api.service';
import { CartService, CartItem } from '../../../shared/services/cart.service';

// ─── Sale Success Dialog ──────────────────────────────────────────────────────

@Component({
  selector: 'app-sale-success-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatDividerModule, MatIconModule],
  template: `
    <div class="success-header">
      <mat-icon class="success-icon">check_circle</mat-icon>
      <h2 mat-dialog-title>Sale Completed!</h2>
    </div>

    <mat-dialog-content>
      <div class="receipt">
        <div class="receipt-row">
          <span class="label">Sale ID:</span>
          <span>#{{ sale.saleId }}</span>
        </div>
        <div class="receipt-row">
          <span class="label">Date:</span>
          <span>{{ sale.soldAt | date:'medium' }}</span>
        </div>

        <mat-divider></mat-divider>

        <table class="receipt-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of sale.items">
              <td>Product #{{ item.productId }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.unitPrice | currency:'INR':'symbol':'1.2-2' }}</td>
              <td>{{ item.lineTotal | currency:'INR':'symbol':'1.2-2' }}</td>
            </tr>
          </tbody>
        </table>

        <mat-divider></mat-divider>

        <div class="grand-total-row">
          <span>Grand Total:</span>
          <span class="grand-total-amount">{{ sale.totalAmount | currency:'INR':'symbol':'1.2-2' }}</span>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" mat-dialog-close>
        <mat-icon>done</mat-icon>
        Done
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .success-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px 0;
    }
    .success-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #388e3c;
    }
    h2[mat-dialog-title] {
      margin: 0;
      color: #388e3c;
    }
    .receipt {
      min-width: 420px;
      padding-top: 8px;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }
    .label {
      color: #666;
    }
    mat-divider {
      margin: 12px 0;
    }
    .receipt-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .receipt-table th {
      text-align: left;
      padding: 6px 8px;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
    }
    .receipt-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #eee;
    }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      font-size: 18px;
      font-weight: bold;
      padding: 8px 0;
    }
    .grand-total-amount {
      color: #1976d2;
    }
  `]
})
export class SaleSuccessDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public sale: SaleResponse,
    private dialogRef: MatDialogRef<SaleSuccessDialogComponent>
  ) {}
}

@Component({
  selector: 'app-sell',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="pos-container">
      <h1>Point of Sale - Checkout</h1>

      <div class="pos-layout">
        <!-- Left: Search and Product Selection -->
        <div class="search-section">
          <mat-form-field>
            <mat-label>Search Product (SKU/Name)</mat-label>
            <input matInput 
                   [(ngModel)]="searchQuery" 
                   (input)="onProductSearch()"
                   placeholder="Type product SKU or name...">
          </mat-form-field>

          <div *ngIf="filteredProducts.length > 0" class="product-suggestions">
            <div *ngFor="let product of filteredProducts" 
                 class="product-suggestion"
                 (click)="addProductToCart(product)">
              <div class="product-info">
                <strong>{{ product.sku }}</strong> - {{ product.name }}
              </div>
              <div class="product-meta">
                {{ product.unitPrice | currency:'INR':'symbol':'1.2-2' }} | Stock: {{ product.stockQuantity }}
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Cart Summary -->
        <div class="cart-summary">
          <mat-card>
            <mat-card-content>
              <h2>Order Summary</h2>
              <mat-divider></mat-divider>

              <div *ngIf="cartItems.length === 0" class="empty-cart">
                <mat-icon>shopping_cart</mat-icon>
                <p>Cart is empty</p>
              </div>

              <table *ngIf="cartItems.length > 0" class="cart-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of cartItems">
                    <td>{{ item.product.name }}</td>
                    <td>
                      <input type="number" 
                             [(ngModel)]="item.quantity" 
                             min="1" 
                             [max]="item.product.stockQuantity"
                             (change)="updateCartItem(item)">
                    </td>
                    <td>{{ item.unitPrice | currency:'INR':'symbol':'1.2-2' }}</td>
                    <td>{{ item.lineTotal | currency:'INR':'symbol':'1.2-2' }}</td>
                    <td>
                      <button mat-icon-button (click)="removeFromCart(item.product.id!)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <mat-divider *ngIf="cartItems.length > 0"></mat-divider>

              <div *ngIf="cartItems.length > 0" class="totals">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>{{ getCartSubtotal() | currency:'INR':'symbol':'1.2-2' }}</span>
                </div>
                <div class="total-row">
                  <span>Tax (0%):</span>
                  <span>{{ 0 | currency:'INR':'symbol':'1.2-2' }}</span>
                </div>
                <div class="total-row grand-total">
                  <span>Grand Total:</span>
                  <span>{{ getCartSubtotal() | currency:'INR':'symbol':'1.2-2' }}</span>
                </div>
              </div>

              <div class="action-buttons" *ngIf="cartItems.length > 0">
                <button mat-raised-button (click)="clearCart()">
                  <mat-icon>clear</mat-icon>
                  Clear Cart
                </button>
                <button mat-raised-button color="primary" (click)="completeSale()">
                  <mat-icon>check_circle</mat-icon>
                  Complete Sale
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pos-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .pos-layout {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 24px;
      margin-top: 24px;
    }

    .search-section {
      margin-bottom: 24px;
    }

    .product-suggestions {
      border: 1px solid #ddd;
      border-radius: 4px;
      max-height: 400px;
      overflow-y: auto;
      margin-top: 8px;
    }

    .product-suggestion {
      padding: 12px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .product-suggestion:hover {
      background-color: #f5f5f5;
    }

    .product-info {
      font-weight: 500;
    }

    .product-meta {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }

    .cart-summary {
      position: sticky;
      top: 100px;
    }

    .empty-cart {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }

    .empty-cart mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ddd;
    }

    .cart-table {
      width: 100%;
      font-size: 12px;
      border-collapse: collapse;
      margin: 16px 0;
    }

    .cart-table th {
      background-color: #f5f5f5;
      padding: 8px;
      text-align: left;
      font-weight: 500;
      border-bottom: 1px solid #ddd;
    }

    .cart-table td {
      padding: 8px;
      border-bottom: 1px solid #eee;
    }

    .cart-table input {
      width: 60px;
      padding: 4px;
      border: 1px solid #ddd;
      border-radius: 2px;
    }

    .totals {
      margin: 16px 0;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }

    .grand-total {
      font-size: 18px;
      font-weight: bold;
      color: #1976d2;
      padding-top: 8px;
      border-top: 2px solid #ddd;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      flex-direction: column;
    }

    .action-buttons button {
      width: 100%;
    }

    @media (max-width: 1024px) {
      .pos-layout {
        grid-template-columns: 1fr;
      }

      .cart-summary {
        position: static;
      }
    }
  `]
})
export class SellComponent implements OnInit {
  searchQuery = '';
  filteredProducts: ProductDTO[] = [];
  cartItems: CartItem[] = [];
  allProducts: ProductDTO[] = [];
  loading = false;

  constructor(
    private apiService: ApiService,
    private cartService: CartService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllProducts();
    this.cartService.getCart().subscribe(items => {
      this.cartItems = items;
    });
  }

  loadAllProducts(): void {
    this.apiService.getProducts(undefined, true).subscribe({
      next: (products) => {
        this.allProducts = products;
      },
      error: (error) => console.error('Failed to load products', error)
    });
  }

  onProductSearch(): void {
    if (this.searchQuery.length === 0) {
      this.filteredProducts = [];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredProducts = this.allProducts.filter(p =>
      p.sku.toLowerCase().includes(query) ||
      p.name.toLowerCase().includes(query)
    ).slice(0, 5); // Limit to 5 results
  }

  addProductToCart(product: ProductDTO): void {
    try {
      this.cartService.addToCart(product, 1, product.unitPrice);
      this.searchQuery = '';
      this.filteredProducts = [];
    } catch (error) {
      console.error('Failed to add product to cart', error);
    }
  }

  updateCartItem(item: CartItem): void {
    try {
      this.cartService.updateCartItem(item.product.id!, item.quantity, item.unitPrice);
    } catch (error) {
      console.error('Failed to update cart item', error);
    }
  }

  removeFromCart(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  getCartSubtotal(): number {
    return this.cartService.getCartTotal();
  }

  completeSale(): void {
    const items = this.cartItems.map(item => ({
      productId: item.product.id!,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }));

    const request: SaleRequest = { items };

    this.loading = true;
    this.apiService.createSale(request).subscribe({
      next: (response) => {
        this.cartService.clearCart();
        this.loading = false;
        const dialogRef = this.dialog.open(SaleSuccessDialogComponent, {
          width: '500px',
          disableClose: true,
          data: response
        });
        // After closing the receipt, go to products so stock counts are fresh
        dialogRef.afterClosed().subscribe(() => {
          this.router.navigate(['/products']);
        });
      },
      error: (error) => {
        console.error('Failed to complete sale', error);
        this.loading = false;
        this.snackBar.open(
          error?.error?.message || 'Failed to complete sale. Please try again.',
          'Close',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }
}
