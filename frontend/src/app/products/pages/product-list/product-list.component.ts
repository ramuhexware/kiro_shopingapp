import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService, ProductDTO, CreateProductRequest, UpdateProductRequest, PurchaseRequest } from '../../../core/services/api.service';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

// ─── Create Product Dialog ────────────────────────────────────────────────────

@Component({
  selector: 'app-create-product-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Add Product</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>SKU</mat-label>
          <input matInput formControlName="sku" placeholder="e.g. PROD-001">
          <mat-error *ngIf="form.get('sku')?.hasError('required')">SKU is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name">
          <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Unit Price</mat-label>
          <input matInput type="number" formControlName="unitPrice" min="0" step="0.01">
          <mat-error *ngIf="form.get('unitPrice')?.hasError('required')">Unit price is required</mat-error>
          <mat-error *ngIf="form.get('unitPrice')?.hasError('min')">Price must be 0 or greater</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Initial Stock Quantity</mat-label>
          <input matInput type="number" formControlName="stockQuantity" min="0">
          <mat-error *ngIf="form.get('stockQuantity')?.hasError('min')">Stock quantity must be 0 or greater</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Min Stock Level</mat-label>
          <input matInput type="number" formControlName="minStockLevel" min="0">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="onSubmit()">Create</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 400px; padding-top: 8px; }
  `]
})
export class CreateProductDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateProductDialogComponent>
  ) {
    this.form = this.fb.group({
      sku: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      unitPrice: [null, [Validators.required, Validators.min(0)]],
      stockQuantity: [0, Validators.min(0)],
      minStockLevel: [0, Validators.min(0)]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const request: CreateProductRequest = {
        sku: this.form.value.sku.trim(),
        name: this.form.value.name.trim(),
        description: this.form.value.description?.trim() || undefined,
        unitPrice: Number(this.form.value.unitPrice),
        stockQuantity: Number(this.form.value.stockQuantity) || 0,
        minStockLevel: Number(this.form.value.minStockLevel) || 0
      };
      this.dialogRef.close(request);
    }
  }
}

// ─── Edit Product Dialog ──────────────────────────────────────────────────────

@Component({
  selector: 'app-edit-product-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>Edit Product</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name">
          <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Unit Price</mat-label>
          <input matInput type="number" formControlName="unitPrice" min="0" step="0.01">
          <mat-error *ngIf="form.get('unitPrice')?.hasError('required')">Unit price is required</mat-error>
          <mat-error *ngIf="form.get('unitPrice')?.hasError('min')">Price must be 0 or greater</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Min Stock Level</mat-label>
          <input matInput type="number" formControlName="minStockLevel" min="0">
        </mat-form-field>

        <mat-checkbox formControlName="active">Active</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="onSubmit()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 400px; padding-top: 8px; }
  `]
})
export class EditProductDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public product: ProductDTO
  ) {
    this.form = this.fb.group({
      name: [product.name, Validators.required],
      description: [product.description || ''],
      unitPrice: [product.unitPrice, [Validators.required, Validators.min(0)]],
      minStockLevel: [product.minStockLevel ?? 0, Validators.min(0)],
      active: [product.active ?? true]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const request: UpdateProductRequest = {
        name: this.form.value.name.trim(),
        description: this.form.value.description?.trim() || undefined,
        unitPrice: Number(this.form.value.unitPrice),
        minStockLevel: Number(this.form.value.minStockLevel) || 0,
        active: this.form.value.active,
        version: this.product.version!
      };
      this.dialogRef.close(request);
    }
  }
}

// ─── Purchase Stock Dialog ────────────────────────────────────────────────────

@Component({
  selector: 'app-purchase-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Purchase Stock — {{ product.name }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Quantity</mat-label>
          <input matInput type="number" formControlName="quantity" min="1">
          <mat-error *ngIf="form.get('quantity')?.hasError('required')">Quantity is required</mat-error>
          <mat-error *ngIf="form.get('quantity')?.hasError('min')">Quantity must be at least 1</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Unit Cost (optional)</mat-label>
          <input matInput type="number" formControlName="unitCost" min="0" step="0.01">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="onSubmit()">Purchase</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 360px; padding-top: 8px; }
  `]
})
export class PurchaseDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PurchaseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public product: ProductDTO
  ) {
    this.form = this.fb.group({
      quantity: [null, [Validators.required, Validators.min(1)]],
      unitCost: [null]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const request: PurchaseRequest = {
        productId: this.product.id!,
        quantity: Number(this.form.value.quantity),
        unitCost: this.form.value.unitCost ? Number(this.form.value.unitCost) : undefined
      };
      this.dialogRef.close(request);
    }
  }
}

// ─── Product List Component ───────────────────────────────────────────────────

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    HasRoleDirective
  ],
  template: `
    <div class="container">
      <h1>Product Management</h1>

      <div class="search-bar">
        <mat-form-field>
          <mat-label>Search by SKU or Name</mat-label>
          <input matInput [(ngModel)]="searchQuery" (input)="onSearch()">
        </mat-form-field>

        <mat-checkbox [(ngModel)]="filterActive" (change)="onSearch()">
          Active Only
        </mat-checkbox>

        <button mat-raised-button color="primary" *appHasRole="'ADMIN'" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Product
        </button>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="50"></mat-spinner>
      </div>

      <table *ngIf="!loading" mat-table [dataSource]="products" class="products-table">
        <!-- SKU Column -->
        <ng-container matColumnDef="sku">
          <th mat-header-cell *matHeaderCellDef>SKU</th>
          <td mat-cell *matCellDef="let product">{{ product.sku }}</td>
        </ng-container>

        <!-- Name Column -->
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let product">{{ product.name }}</td>
        </ng-container>

        <!-- Price Column -->
        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef>Unit Price</th>
          <td mat-cell *matCellDef="let product">{{ product.unitPrice | currency:'INR':'symbol':'1.2-2' }}</td>
        </ng-container>

        <!-- Stock Column -->
        <ng-container matColumnDef="stock">
          <th mat-header-cell *matHeaderCellDef>Stock</th>
          <td mat-cell *matCellDef="let product">
            <span [ngClass]="product.stockQuantity < product.minStockLevel ? 'low-stock' : ''">
              {{ product.stockQuantity }}
            </span>
          </td>
        </ng-container>

        <!-- Active Column -->
        <ng-container matColumnDef="active">
          <th mat-header-cell *matHeaderCellDef>Active</th>
          <td mat-cell *matCellDef="let product">
            <mat-icon [style.color]="product.active ? '#388e3c' : '#d32f2f'">
              {{ product.active ? 'check_circle' : 'cancel' }}
            </mat-icon>
          </td>
        </ng-container>

        <!-- Actions Column -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let product">
            <button mat-icon-button matTooltip="Edit" *appHasRole="'ADMIN'" (click)="onEdit(product)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button [matTooltip]="product.active ? 'Deactivate' : 'Activate'" *appHasRole="'ADMIN'" (click)="onToggleActive(product)">
              <mat-icon>{{ product.active ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Purchase Stock" *appHasRole="'ADMIN'" (click)="onPurchase(product)">
              <mat-icon>add_circle</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <p *ngIf="!loading && products.length === 0" class="empty-state">
        No products found.
      </p>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .search-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      align-items: center;
      flex-wrap: wrap;
    }

    .products-table {
      width: 100%;
      border-collapse: collapse;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .low-stock {
      color: #d32f2f;
      font-weight: bold;
    }

    .empty-state {
      text-align: center;
      color: #888;
      padding: 40px;
    }

    h1 {
      margin-bottom: 24px;
      color: #333;
    }
  `]
})
export class ProductListComponent implements OnInit {
  products: ProductDTO[] = [];
  loading = false;
  searchQuery = '';
  filterActive = false;
  displayedColumns = ['sku', 'name', 'price', 'stock', 'active', 'actions'];

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    const active = this.filterActive ? true : undefined;
    this.apiService.getProducts(this.searchQuery || undefined, active).subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load products', error);
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.loadProducts();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateProductDialogComponent, {
      width: '480px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((request: CreateProductRequest | undefined) => {
      if (!request) return;
      this.apiService.createProduct(request).subscribe({
        next: () => {
          this.snackBar.open('Product created successfully', 'Close', { duration: 3000 });
          this.loadProducts();
        },
        error: (err) => {
          console.error('Failed to create product', err);
        }
      });
    });
  }

  onEdit(product: ProductDTO): void {
    const dialogRef = this.dialog.open(EditProductDialogComponent, {
      width: '480px',
      disableClose: true,
      data: product
    });

    dialogRef.afterClosed().subscribe((request: UpdateProductRequest | undefined) => {
      if (!request) return;
      this.apiService.updateProduct(product.id!, request).subscribe({
        next: (updated) => {
          const index = this.products.findIndex(p => p.id === product.id);
          if (index !== -1) this.products[index] = updated;
          this.products = [...this.products];
          this.snackBar.open('Product updated successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Failed to update product', err);
        }
      });
    });
  }

  onToggleActive(product: ProductDTO): void {
    this.apiService.toggleProductActive(product.id!).subscribe({
      next: (updated) => {
        const index = this.products.findIndex(p => p.id === product.id);
        if (index !== -1) this.products[index] = updated;
        this.products = [...this.products];
        const status = updated.active ? 'activated' : 'deactivated';
        this.snackBar.open(`Product ${status}`, 'Close', { duration: 3000 });
      },
      error: (err) => console.error('Failed to toggle active', err)
    });
  }

  onPurchase(product: ProductDTO): void {
    const dialogRef = this.dialog.open(PurchaseDialogComponent, {
      width: '420px',
      disableClose: true,
      data: product
    });

    dialogRef.afterClosed().subscribe((request: PurchaseRequest | undefined) => {
      if (!request) return;
      this.apiService.purchaseStock(request).subscribe({
        next: (updated) => {
          const index = this.products.findIndex(p => p.id === product.id);
          if (index !== -1) this.products[index] = updated;
          this.products = [...this.products];
          this.snackBar.open(`Stock updated. New quantity: ${updated.stockQuantity}`, 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Failed to purchase stock', err);
        }
      });
    });
  }
}
