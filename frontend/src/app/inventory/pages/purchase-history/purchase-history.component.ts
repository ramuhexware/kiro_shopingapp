import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ApiService, PurchaseResponse } from '../../../core/services/api.service';

@Component({
  selector: 'app-purchase-history',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    CurrencyPipe,
    DatePipe
  ],
  template: `
    <div class="container">
      <h1>Purchase History</h1>
      <p class="subtitle">Stock-in records — all inventory purchases made by admins.</p>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="50"></mat-spinner>
      </div>

      <div *ngIf="!loading && error" class="error-state">
        <mat-icon class="error-icon">error_outline</mat-icon>
        <p>Failed to load purchase history. Please try again.</p>
      </div>

      <div *ngIf="!loading && !error && purchases.length === 0" class="empty-state">
        <mat-icon class="empty-icon">local_shipping</mat-icon>
        <p>No stock purchases have been recorded yet.</p>
      </div>

      <table *ngIf="!loading && !error && purchases.length > 0"
             mat-table [dataSource]="purchases" class="purchases-table">

        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>#</th>
          <td mat-cell *matCellDef="let p">{{ p.id }}</td>
        </ng-container>

        <ng-container matColumnDef="purchasedAt">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let p">{{ p.purchasedAt | date:'medium' }}</td>
        </ng-container>

        <ng-container matColumnDef="product">
          <th mat-header-cell *matHeaderCellDef>Product</th>
          <td mat-cell *matCellDef="let p">
            <span class="product-name">{{ p.productName }}</span>
            <span class="product-sku">{{ p.productSku }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="quantity">
          <th mat-header-cell *matHeaderCellDef>Qty Added</th>
          <td mat-cell *matCellDef="let p" class="qty-cell">+{{ p.quantity }}</td>
        </ng-container>

        <ng-container matColumnDef="unitCost">
          <th mat-header-cell *matHeaderCellDef>Unit Cost</th>
          <td mat-cell *matCellDef="let p">
            {{ p.unitCost != null ? (p.unitCost | currency:'INR':'symbol':'1.2-2') : '—' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="totalCost">
          <th mat-header-cell *matHeaderCellDef>Total Cost</th>
          <td mat-cell *matCellDef="let p">
            {{ p.unitCost != null ? (p.unitCost * p.quantity | currency:'INR':'symbol':'1.2-2') : '—' }}
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .container { max-width: 1100px; margin: 0 auto; padding: 20px; }
    h1 { margin-bottom: 4px; color: #333; }
    .subtitle { color: #666; margin-bottom: 24px; font-size: 14px; }
    .loading { display: flex; justify-content: center; padding: 60px; }
    .error-state, .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 60px 20px; color: #888; text-align: center;
    }
    .error-state { color: #d32f2f; }
    .error-icon, .empty-icon { font-size: 64px; width: 64px; height: 64px; margin-bottom: 16px; }
    .error-icon { color: #d32f2f; }
    .empty-icon { color: #bdbdbd; }
    .error-state p, .empty-state p { font-size: 16px; margin: 0; }
    .purchases-table { width: 100%; }
    .product-name { display: block; font-weight: 500; }
    .product-sku { display: block; font-size: 12px; color: #888; }
    .qty-cell { color: #388e3c; font-weight: 500; }
  `]
})
export class PurchaseHistoryComponent implements OnInit {
  purchases: PurchaseResponse[] = [];
  loading = false;
  error = false;

  displayedColumns = ['id', 'purchasedAt', 'product', 'quantity', 'unitCost', 'totalCost'];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = false;
    this.apiService.getPurchaseHistory().subscribe({
      next: (data) => { this.purchases = data; this.loading = false; },
      error: () => { this.error = true; this.loading = false; }
    });
  }
}
