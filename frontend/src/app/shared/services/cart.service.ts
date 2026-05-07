import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProductDTO } from '../../core/services/api.service';

export interface CartItem {
  product: ProductDTO;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cart$ = new BehaviorSubject<CartItem[]>([]);
  private readonly STORAGE_KEY = 'shop_cart_draft';

  constructor() {
    this.loadCartFromStorage();
  }

  getCart(): Observable<CartItem[]> {
    return this.cart$.asObservable();
  }

  getCurrentCart(): CartItem[] {
    return this.cart$.getValue();
  }

  addToCart(product: ProductDTO, quantity: number, unitPrice?: number): void {
    const currentCart = this.cart$.getValue();
    const existingItem = currentCart.find(item => item.product.id === product.id);
    const price = unitPrice || product.unitPrice;

    if (existingItem) {
      // Update quantity and line total
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stockQuantity) {
        throw new Error(`Insufficient stock. Available: ${product.stockQuantity}, Requested: ${newQuantity}`);
      }
      existingItem.quantity = newQuantity;
      existingItem.lineTotal = existingItem.quantity * price;
    } else {
      // Add new item
      if (quantity > product.stockQuantity) {
        throw new Error(`Insufficient stock. Available: ${product.stockQuantity}, Requested: ${quantity}`);
      }
      currentCart.push({
        product,
        quantity,
        unitPrice: price,
        lineTotal: quantity * price
      });
    }

    this.cart$.next([...currentCart]);
    this.saveCartToStorage();
  }

  updateCartItem(productId: number, quantity: number, unitPrice: number): void {
    const currentCart = this.cart$.getValue();
    const item = currentCart.find(i => i.product.id === productId);

    if (item) {
      if (quantity > item.product.stockQuantity) {
        throw new Error(`Insufficient stock. Available: ${item.product.stockQuantity}, Requested: ${quantity}`);
      }
      item.quantity = quantity;
      item.unitPrice = unitPrice;
      item.lineTotal = quantity * unitPrice;
      this.cart$.next([...currentCart]);
      this.saveCartToStorage();
    }
  }

  removeFromCart(productId: number): void {
    const currentCart = this.cart$.getValue();
    const filtered = currentCart.filter(item => item.product.id !== productId);
    this.cart$.next(filtered);
    this.saveCartToStorage();
  }

  clearCart(): void {
    this.cart$.next([]);
    this.saveCartToStorage();
  }

  getCartTotal(): number {
    return this.cart$.getValue().reduce((total, item) => total + item.lineTotal, 0);
  }

  getCartItemCount(): number {
    return this.cart$.getValue().length;
  }

  private saveCartToStorage(): void {
    try {
      const cartData = this.cart$.getValue().map(item => ({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal
      }));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cartData));
    } catch (error) {
      console.error('Failed to save cart to storage', error);
    }
  }

  private loadCartFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const cartData = JSON.parse(stored) as CartItem[];
        this.cart$.next(cartData);
      }
    } catch (error) {
      console.error('Failed to load cart from storage', error);
      this.clearCart();
    }
  }
}
