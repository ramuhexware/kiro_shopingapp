import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

/** Validator that checks both password fields match. */
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (password && confirm && password.value !== confirm.value) {
    confirm.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }
  return null;
}

/**
 * Registration page component.
 * Allows new users to create an account with USER role.
 * On success the user is immediately logged in and redirected to /products.
 */
@Component({
  selector: 'app-register',
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
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon class="auth-icon">person_add</mat-icon>
            Create Account
          </mat-card-title>
          <mat-card-subtitle>Shop Inventory Management</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" novalidate>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input
                matInput
                formControlName="username"
                autocomplete="username"
                placeholder="Choose a username"
              />
              <mat-icon matSuffix>person</mat-icon>
              <mat-error *ngIf="registerForm.get('username')?.hasError('required')">
                Username is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('username')?.hasError('minlength')">
                Username must be at least 3 characters
              </mat-error>
              <mat-error *ngIf="registerForm.get('username')?.hasError('maxlength')">
                Username cannot exceed 50 characters
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input
                matInput
                formControlName="email"
                type="email"
                autocomplete="email"
                placeholder="Enter your email"
              />
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                Please enter a valid email address
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="hidePassword ? 'password' : 'text'"
                formControlName="password"
                autocomplete="new-password"
                placeholder="Create a password"
              />
              <button
                mat-icon-button matSuffix type="button"
                (click)="hidePassword = !hidePassword"
                [attr.aria-label]="hidePassword ? 'Show password' : 'Hide password'"
              >
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
                Password must be at least 6 characters
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input
                matInput
                [type]="hideConfirm ? 'password' : 'text'"
                formControlName="confirmPassword"
                autocomplete="new-password"
                placeholder="Repeat your password"
              />
              <button
                mat-icon-button matSuffix type="button"
                (click)="hideConfirm = !hideConfirm"
                [attr.aria-label]="hideConfirm ? 'Show password' : 'Hide password'"
              >
                <mat-icon>{{ hideConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('required')">
                Please confirm your password
              </mat-error>
              <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('passwordMismatch')">
                Passwords do not match
              </mat-error>
            </mat-form-field>

            <div *ngIf="errorMessage" class="error-message" role="alert">
              <mat-icon>error_outline</mat-icon>
              {{ errorMessage }}
            </div>

            <button
              mat-raised-button color="primary" type="submit"
              class="full-width submit-button"
              [disabled]="registerForm.invalid || loading"
            >
              <mat-icon *ngIf="!loading">how_to_reg</mat-icon>
              {{ loading ? 'Creating account...' : 'Create Account' }}
            </button>

          </form>
        </mat-card-content>

        <mat-card-actions class="card-actions">
          <span class="link-text">Already have an account?</span>
          <a mat-button color="primary" routerLink="/login">Sign In</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 64px);
      padding: 24px;
      background-color: #f5f5f5;
    }

    .auth-card {
      width: 100%;
      max-width: 440px;
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

    .auth-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #1976d2;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 4px;
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
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage = '';
  loading = false;
  hidePassword = true;
  hideConfirm = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/products']);
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.errorMessage = '';
    this.loading = true;

    const { username, email, password } = this.registerForm.value;

    this.authService.register({ username, email, password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/products']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 400 && err.error?.message) {
          this.errorMessage = err.error.message;
        } else if (err.status === 409) {
          this.errorMessage = 'Username or email is already taken.';
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      }
    });
  }
}
