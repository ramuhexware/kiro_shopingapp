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
 * Forgot Password page component.
 *
 * The user enters their email address. The backend generates a reset token
 * (in production this would be emailed; here it is returned in the response
 * so the UI can navigate directly to the reset page).
 */
@Component({
  selector: 'app-forgot-password',
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
            <mat-icon class="auth-icon">lock_reset</mat-icon>
            Forgot Password
          </mat-card-title>
          <mat-card-subtitle>Enter your email to receive a reset link</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>

          <!-- Success state -->
          <div *ngIf="resetToken; else formBlock" class="success-block">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <p class="success-title">Reset token generated!</p>
            <p class="success-body">
              In a production app this would be emailed to you. For this demo,
              click the button below to proceed directly to the reset page.
            </p>
            <button
              mat-raised-button color="primary"
              class="full-width submit-button"
              (click)="goToReset()"
            >
              <mat-icon>lock_open</mat-icon>
              Set New Password
            </button>
          </div>

          <!-- Form state -->
          <ng-template #formBlock>
            <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" novalidate>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email Address</mat-label>
                <input
                  matInput
                  formControlName="email"
                  type="email"
                  autocomplete="email"
                  placeholder="Enter your registered email"
                />
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="forgotForm.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="forgotForm.get('email')?.hasError('email')">
                  Please enter a valid email address
                </mat-error>
              </mat-form-field>

              <div *ngIf="errorMessage" class="error-message" role="alert">
                <mat-icon>error_outline</mat-icon>
                {{ errorMessage }}
              </div>

              <button
                mat-raised-button color="primary" type="submit"
                class="full-width submit-button"
                [disabled]="forgotForm.invalid || loading"
              >
                <mat-icon *ngIf="!loading">send</mat-icon>
                {{ loading ? 'Sending...' : 'Send Reset Link' }}
              </button>

            </form>
          </ng-template>

        </mat-card-content>

        <mat-card-actions class="card-actions">
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

    .success-block {
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

    .success-title {
      font-size: 18px;
      font-weight: 500;
      margin: 0 0 8px;
    }

    .success-body {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      margin: 0 0 24px;
    }
  `]
})
export class ForgotPasswordComponent implements OnInit {
  forgotForm: FormGroup;
  errorMessage = '';
  loading = false;
  resetToken = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/products']);
    }
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      return;
    }

    this.errorMessage = '';
    this.loading = true;

    this.authService.forgotPassword(this.forgotForm.value.email).subscribe({
      next: (response) => {
        this.loading = false;
        this.resetToken = response.resetToken;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 400 && err.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'An error occurred. Please try again.';
        }
      }
    });
  }

  goToReset(): void {
    this.router.navigate(['/reset-password'], { queryParams: { token: this.resetToken } });
  }
}
