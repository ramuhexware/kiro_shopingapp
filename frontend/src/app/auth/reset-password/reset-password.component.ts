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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

/** Validator that checks both password fields match. */
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword');
  const confirm = control.get('confirmPassword');
  if (password && confirm && password.value !== confirm.value) {
    confirm.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }
  return null;
}

/**
 * Reset Password page component.
 *
 * Reads the reset token from the query string (?token=...) and lets the user
 * set a new password. On success, redirects to /login.
 */
@Component({
  selector: 'app-reset-password',
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
            <mat-icon class="auth-icon">lock_open</mat-icon>
            Set New Password
          </mat-card-title>
          <mat-card-subtitle>Choose a strong password for your account</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>

          <!-- Success state -->
          <div *ngIf="success; else formBlock" class="success-block">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <p class="success-title">Password reset successfully!</p>
            <p class="success-body">You can now sign in with your new password.</p>
            <button
              mat-raised-button color="primary"
              class="full-width submit-button"
              routerLink="/login"
            >
              <mat-icon>login</mat-icon>
              Go to Sign In
            </button>
          </div>

          <!-- Invalid / missing token state -->
          <div *ngIf="!token && !success" class="error-block">
            <mat-icon class="error-icon">error</mat-icon>
            <p class="error-title">Invalid reset link</p>
            <p class="error-body">
              This link is missing a reset token. Please request a new password reset.
            </p>
            <a mat-raised-button color="primary" routerLink="/forgot-password" class="full-width submit-button">
              Request New Link
            </a>
          </div>

          <!-- Form state -->
          <ng-template #formBlock>
            <form *ngIf="token" [formGroup]="resetForm" (ngSubmit)="onSubmit()" novalidate>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>New Password</mat-label>
                <input
                  matInput
                  [type]="hidePassword ? 'password' : 'text'"
                  formControlName="newPassword"
                  autocomplete="new-password"
                  placeholder="Enter new password"
                />
                <button
                  mat-icon-button matSuffix type="button"
                  (click)="hidePassword = !hidePassword"
                  [attr.aria-label]="hidePassword ? 'Show password' : 'Hide password'"
                >
                  <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="resetForm.get('newPassword')?.hasError('required')">
                  New password is required
                </mat-error>
                <mat-error *ngIf="resetForm.get('newPassword')?.hasError('minlength')">
                  Password must be at least 6 characters
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm New Password</mat-label>
                <input
                  matInput
                  [type]="hideConfirm ? 'password' : 'text'"
                  formControlName="confirmPassword"
                  autocomplete="new-password"
                  placeholder="Repeat new password"
                />
                <button
                  mat-icon-button matSuffix type="button"
                  (click)="hideConfirm = !hideConfirm"
                  [attr.aria-label]="hideConfirm ? 'Show password' : 'Hide password'"
                >
                  <mat-icon>{{ hideConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="resetForm.get('confirmPassword')?.hasError('required')">
                  Please confirm your password
                </mat-error>
                <mat-error *ngIf="resetForm.get('confirmPassword')?.hasError('passwordMismatch')">
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
                [disabled]="resetForm.invalid || loading"
              >
                <mat-icon *ngIf="!loading">save</mat-icon>
                {{ loading ? 'Saving...' : 'Save New Password' }}
              </button>

            </form>
          </ng-template>

        </mat-card-content>

        <mat-card-actions class="card-actions" *ngIf="!success">
          <a mat-button color="primary" routerLink="/login">
            <mat-icon>arrow_back</mat-icon>
            Back to Sign In
          </a>
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
      padding: 8px 16px 16px;
    }

    .success-block, .error-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 8px 0;
    }

    .success-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: #4caf50;
      margin-bottom: 12px;
    }

    .error-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: #f44336;
      margin-bottom: 12px;
    }

    .success-title, .error-title {
      font-size: 18px;
      font-weight: 500;
      margin: 0 0 8px;
    }

    .success-body, .error-body {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      margin: 0 0 24px;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  errorMessage = '';
  loading = false;
  success = false;
  hidePassword = true;
  hideConfirm = true;
  token = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.resetForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.token) {
      return;
    }

    this.errorMessage = '';
    this.loading = true;

    this.authService.resetPassword(this.token, this.resetForm.value.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 400 && err.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Failed to reset password. The link may have expired.';
        }
      }
    });
  }
}
