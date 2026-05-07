import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

/** Validator that checks new password and confirm password match. */
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPwd = control.get('newPassword');
  const confirm = control.get('confirmPassword');
  if (newPwd && confirm && newPwd.value !== confirm.value) {
    confirm.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }
  return null;
}

/**
 * Change Password page for authenticated users.
 * Requires the current password before setting a new one.
 */
@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
            <mat-icon class="auth-icon">lock</mat-icon>
            Change Password
          </mat-card-title>
          <mat-card-subtitle>Update your account password</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>

          <!-- Success state -->
          <div *ngIf="success" class="success-block">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <p class="success-title">Password changed!</p>
            <p class="success-body">Your password has been updated successfully.</p>
            <button
              mat-raised-button color="primary"
              class="full-width submit-button"
              (click)="goBack()"
            >
              <mat-icon>arrow_back</mat-icon>
              Back to Products
            </button>
          </div>

          <!-- Form state -->
          <form *ngIf="!success" [formGroup]="changeForm" (ngSubmit)="onSubmit()" novalidate>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Current Password</mat-label>
              <input
                matInput
                [type]="hideCurrent ? 'password' : 'text'"
                formControlName="currentPassword"
                autocomplete="current-password"
                placeholder="Enter your current password"
              />
              <button
                mat-icon-button matSuffix type="button"
                (click)="hideCurrent = !hideCurrent"
                [attr.aria-label]="hideCurrent ? 'Show password' : 'Hide password'"
              >
                <mat-icon>{{ hideCurrent ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="changeForm.get('currentPassword')?.hasError('required')">
                Current password is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>New Password</mat-label>
              <input
                matInput
                [type]="hideNew ? 'password' : 'text'"
                formControlName="newPassword"
                autocomplete="new-password"
                placeholder="Enter new password"
              />
              <button
                mat-icon-button matSuffix type="button"
                (click)="hideNew = !hideNew"
                [attr.aria-label]="hideNew ? 'Show password' : 'Hide password'"
              >
                <mat-icon>{{ hideNew ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="changeForm.get('newPassword')?.hasError('required')">
                New password is required
              </mat-error>
              <mat-error *ngIf="changeForm.get('newPassword')?.hasError('minlength')">
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
              <mat-error *ngIf="changeForm.get('confirmPassword')?.hasError('required')">
                Please confirm your new password
              </mat-error>
              <mat-error *ngIf="changeForm.get('confirmPassword')?.hasError('passwordMismatch')">
                Passwords do not match
              </mat-error>
            </mat-form-field>

            <div *ngIf="errorMessage" class="error-message" role="alert">
              <mat-icon>error_outline</mat-icon>
              {{ errorMessage }}
            </div>

            <div class="button-row">
              <button
                mat-stroked-button type="button"
                (click)="goBack()"
              >
                Cancel
              </button>
              <button
                mat-raised-button color="primary" type="submit"
                [disabled]="changeForm.invalid || loading"
              >
                <mat-icon *ngIf="!loading">save</mat-icon>
                {{ loading ? 'Saving...' : 'Save Password' }}
              </button>
            </div>

          </form>
        </mat-card-content>
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

    .button-row {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 8px;
    }

    .submit-button {
      margin-top: 8px;
      height: 48px;
      font-size: 16px;
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
export class ChangePasswordComponent {
  changeForm: FormGroup;
  errorMessage = '';
  loading = false;
  success = false;
  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.changeForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: passwordMatchValidator }
    );
  }

  onSubmit(): void {
    if (this.changeForm.invalid) {
      return;
    }

    this.errorMessage = '';
    this.loading = true;

    const { currentPassword, newPassword } = this.changeForm.value;

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 401) {
          this.errorMessage = 'Current password is incorrect.';
        } else if (err.status === 400 && err.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Failed to change password. Please try again.';
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}
