import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

/**
 * Login page component.
 *
 * Presents a username/password form and authenticates the user via AuthService.
 * - On successful login, navigates to /products.
 * - On 401 error, displays an inline error message.
 * - If the user is already authenticated on load, redirects to /products immediately.
 *
 * Validates: Requirements 5.2, 5.3, 5.4, 5.6
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon class="login-icon">lock</mat-icon>
            Sign In
          </mat-card-title>
          <mat-card-subtitle>Shop Inventory Management</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input
                matInput
                formControlName="username"
                autocomplete="username"
                placeholder="Enter your username"
                data-testid="username-input"
              />
              <mat-icon matSuffix>person</mat-icon>
              <mat-error *ngIf="loginForm.get('username')?.hasError('required')">
                Username is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="hidePassword ? 'password' : 'text'"
                formControlName="password"
                autocomplete="current-password"
                placeholder="Enter your password"
                data-testid="password-input"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hidePassword = !hidePassword"
                [attr.aria-label]="hidePassword ? 'Show password' : 'Hide password'"
              >
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
            </mat-form-field>

            <!-- Inline error message for invalid credentials (401) -->
            <div *ngIf="errorMessage" class="error-message" role="alert" data-testid="error-message">
              <mat-icon>error_outline</mat-icon>
              {{ errorMessage }}
            </div>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width submit-button"
              [disabled]="loginForm.invalid || loading"
              data-testid="submit-button"
            >
              <mat-icon *ngIf="!loading">login</mat-icon>
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>

            <div class="link-row">
              <a mat-button color="primary" routerLink="/forgot-password" class="link-button">
                Forgot password?
              </a>
            </div>

          </form>
        </mat-card-content>

        <mat-card-actions class="card-actions">
          <span class="link-text">Don't have an account?</span>
          <a mat-button color="primary" routerLink="/register">Create Account</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 64px);
      padding: 24px;
      background-color: #f5f5f5;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 8px;
    }

    mat-card-header {
      margin-bottom: 24px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 24px;
    }

    .login-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #1976d2;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 8px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      font-size: 14px;
      margin-bottom: 16px;
      padding: 8px 12px;
      background-color: #ffebee;
      border-radius: 4px;
      border-left: 4px solid #f44336;
    }

    .error-message mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .submit-button {
      margin-top: 8px;
      height: 48px;
      font-size: 16px;
    }

    .link-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 4px;
    }

    .link-button {
      font-size: 13px;
    }

    .card-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px 16px 16px;
      gap: 4px;
    }

    .link-text {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage = '';
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // If already authenticated, redirect to /products immediately
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/products']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.errorMessage = '';
    this.loading = true;

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/products']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 401) {
          this.errorMessage = 'Invalid username or password';
        } else {
          this.errorMessage = 'An error occurred. Please try again.';
        }
      }
    });
  }
}
