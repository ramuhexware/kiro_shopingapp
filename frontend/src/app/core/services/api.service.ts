import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest } from '../models/auth.models';

export interface ProductDTO {
  id?: number;
  sku: string;
  name: string;
  description?: string;
  unitPrice: number;
  stockQuantity: number;
  minStockLevel?: number;
  active?: boolean;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  unitPrice: number;
  stockQuantity?: number;
  minStockLevel?: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  unitPrice?: number;
  minStockLevel?: number;
  active?: boolean;
  version: number;
}

export interface PurchaseRequest {
  productId: number;
  quantity: number;
  unitCost?: number;
}

export interface SaleRequest {
  items: SaleItemRequest[];
}

export interface SaleItemRequest {
  productId: number;
  quantity: number;
  unitPrice?: number;
}

export interface SaleResponse {
  saleId: number;
  soldAt: string;
  totalAmount: number;
  items: SaleItemResponse[];
  userId?: number;
}

export interface SaleItemResponse {
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PurchaseResponse {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  unitCost?: number;
  purchasedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Auth endpoints
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, request);
  }

  // Product endpoints
  getProducts(search?: string, active?: boolean): Observable<ProductDTO[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    if (active !== undefined) {
      params = params.set('active', active.toString());
    }
    return this.http.get<ProductDTO[]>(`${this.apiUrl}/products`, { params });
  }

  getProduct(id: number): Observable<ProductDTO> {
    return this.http.get<ProductDTO>(`${this.apiUrl}/products/${id}`);
  }

  createProduct(request: CreateProductRequest): Observable<ProductDTO> {
    return this.http.post<ProductDTO>(`${this.apiUrl}/products`, request);
  }

  updateProduct(id: number, request: UpdateProductRequest): Observable<ProductDTO> {
    return this.http.put<ProductDTO>(`${this.apiUrl}/products/${id}`, request);
  }

  toggleProductActive(id: number): Observable<ProductDTO> {
    return this.http.post<ProductDTO>(`${this.apiUrl}/products/${id}/toggle-active`, {});
  }

  checkSkuExists(sku: string): Observable<boolean> {
    let params = new HttpParams().set('sku', sku);
    return this.http.get<boolean>(`${this.apiUrl}/products/exists`, { params });
  }

  // Inventory endpoints
  purchaseStock(request: PurchaseRequest): Observable<ProductDTO> {
    return this.http.post<ProductDTO>(`${this.apiUrl}/stock/purchase`, request);
  }

  // Sales endpoints
  createSale(request: SaleRequest): Observable<SaleResponse> {
    return this.http.post<SaleResponse>(`${this.apiUrl}/sales`, request);
  }

  getSale(id: number): Observable<SaleResponse> {
    return this.http.get<SaleResponse>(`${this.apiUrl}/sales/${id}`);
  }

  getMyOrders(): Observable<SaleResponse[]> {
    return this.http.get<SaleResponse[]>(`${this.apiUrl}/sales/my-orders`);
  }

  getAllSales(): Observable<SaleResponse[]> {
    return this.http.get<SaleResponse[]>(`${this.apiUrl}/sales`);
  }

  getPurchaseHistory(): Observable<PurchaseResponse[]> {
    return this.http.get<PurchaseResponse[]>(`${this.apiUrl}/stock/purchases`);
  }
}
