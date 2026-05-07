import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from './core/services/auth.service';
import { HasRoleDirective } from './shared/directives/has-role.directive';
import { filter } from 'rxjs/operators';

/** Routes where the nav toolbar should be hidden (unauthenticated pages). */
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    HasRoleDirective
  ],
  template: `
    <!-- Main nav toolbar — only shown when authenticated -->
    <mat-toolbar color="primary" class="app-toolbar" *ngIf="showNav">
      <span class="brand">
        <mat-icon class="brand-icon">storefront</mat-icon>
        Shop Inventory
      </span>
      <span class="spacer"></span>

      <a mat-button routerLink="/products" routerLinkActive="nav-active">
        <mat-icon>inventory_2</mat-icon>
        Products
      </a>
      <a mat-button routerLink="/sell" routerLinkActive="nav-active">
        <mat-icon>point_of_sale</mat-icon>
        Sell
      </a>
      <a mat-button routerLink="/my-orders" routerLinkActive="nav-active" *appHasRole="['USER', 'ADMIN']">
        <mat-icon>receipt_long</mat-icon>
        My Orders
      </a>
      <a mat-button routerLink="/purchase-history" routerLinkActive="nav-active" *appHasRole="'ADMIN'">
        <mat-icon>local_shipping</mat-icon>
        Purchase History
      </a>

      <!-- User menu -->
      <button mat-button [matMenuTriggerFor]="userMenu" class="user-menu-btn">
        <mat-icon>account_circle</mat-icon>
        {{ currentUsername }}
        <mat-icon class="chevron">arrow_drop_down</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item routerLink="/change-password">
          <mat-icon>lock</mat-icon>
          Change Password
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          Sign Out
        </button>
      </mat-menu>
    </mat-toolbar>

    <!-- Minimal branding bar for auth pages -->
    <mat-toolbar color="primary" class="app-toolbar" *ngIf="!showNav">
      <mat-icon class="brand-icon">storefront</mat-icon>
      <span class="brand-text">Shop Inventory Management</span>
    </mat-toolbar>

    <div class="app-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .app-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 500;
    }

    .brand-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .brand-text {
      font-size: 18px;
      font-weight: 500;
      margin-left: 8px;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .app-container {
      padding: 20px;
    }

    a.mat-button {
      color: white;
      margin-left: 4px;
      opacity: 0.85;
    }

    a.mat-button mat-icon {
      margin-right: 4px;
      vertical-align: middle;
    }

    a.nav-active {
      opacity: 1;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 4px;
    }

    .user-menu-btn {
      color: white;
      margin-left: 8px;
      opacity: 0.9;
      display: flex;
      align-items: center;
    }

    .user-menu-btn mat-icon {
      margin-right: 4px;
    }

    .chevron {
      margin-left: 2px;
      margin-right: 0 !important;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `]
})
export class AppComponent {
  showNav = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Update showNav on every route change
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e) => {
        const nav = e as NavigationEnd;
        this.showNav = !AUTH_ROUTES.some(r => nav.urlAfterRedirects.startsWith(r));
      });
  }

  get currentUsername(): string {
    return this.authService.getCurrentUser()?.username ?? '';
  }

  logout(): void {
    this.authService.logout();
  }
}
