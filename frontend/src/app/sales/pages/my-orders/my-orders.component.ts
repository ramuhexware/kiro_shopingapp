import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ApiService, SaleResponse } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    CurrencyPipe,
    DatePipe
  ],
  template: `
    <div class="container">
      <h1>{{ isAdmin ? 'All Sales Orders' : 'My Orders' }}</h1>
      <p class="subtitle" *ngIf="isAdmin">Showing all sales orders across all users.</p>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="50"></mat-spinner>
      </div>

      <div *ngIf="!loading && error" class="error-state">
        <mat-icon class="error-icon">error_outline</mat-icon>
        <p>Failed to load orders. Please try again.</p>
      </div>

      <div *ngIf="!loading && !error && orders.length === 0" class="empty-state">
        <mat-icon class="empty-icon">receipt_long</mat-icon>
        <p>No orders have been placed yet.</p>
      </div>

      <table *ngIf="!loading && !error && orders.length > 0"
             mat-table [dataSource]="orders" class="orders-table">

        <ng-container matColumnDef="saleId">
          <th mat-header-cell *matHeaderCellDef>Sale ID</th>
          <td mat-cell *matCellDef="let order">#{{ order.saleId }}</td>
        </ng-container>

        <ng-container matColumnDef="userId">
          <th mat-header-cell *matHeaderCellDef>User ID</th>
          <td mat-cell *matCellDef="let order">{{ order.userId ?? '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="soldAt">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let order">{{ order.soldAt | date:'medium' }}</td>
        </ng-container>

        <ng-container matColumnDef="totalAmount">
          <th mat-header-cell *matHeaderCellDef>Total Amount</th>
          <td mat-cell *matCellDef="let order">{{ order.totalAmount | currency:'INR':'symbol':'1.2-2' }}</td>
        </ng-container>

        <ng-container matColumnDef="itemCount">
          <th mat-header-cell *matHeaderCellDef>Item Count</th>
          <td mat-cell *matCellDef="let order">{{ order.items.length }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
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
    .orders-table { width: 100%; }
  `]
})
export class MyOrdersComponent implements OnInit {
  orders: SaleResponse[] = [];
  loading = false;
  error = false;
  isAdmin = false;

  get displayedColumns(): string[] {
    return this.isAdmin
      ? ['saleId', 'userId', 'soldAt', 'totalAmount', 'itemCount']
      : ['saleId', 'soldAt', 'totalAmount', 'itemCount'];
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('ADMIN');
    this.loading = true;
    this.error = false;
    this.apiService.getMyOrders().subscribe({
      next: (orders) => { this.orders = orders; this.loading = false; },
      error: () => { this.error = true; this.loading = false; }
    });
  }
}
