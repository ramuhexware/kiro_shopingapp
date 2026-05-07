import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { AuthResponse } from '../../core/models/auth.models';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockAuthResponse: AuthResponse = {
    token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwicm9sZSI6IkFETUlOIn0.sig',
    username: 'admin',
    role: 'ADMIN'
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
      'isAuthenticated',
      'logout',
      'getCurrentUser',
      'hasRole'
    ]);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    // Default: not authenticated
    authServiceSpy.isAuthenticated.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with an empty login form', () => {
    expect(component.loginForm.get('username')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should mark form as invalid when fields are empty', () => {
    expect(component.loginForm.invalid).toBeTrue();
  });

  it('should mark form as valid when both fields are filled', () => {
    component.loginForm.setValue({ username: 'admin', password: 'admin123' });
    expect(component.loginForm.valid).toBeTrue();
  });

  describe('already-authenticated user redirect', () => {
    it('should redirect to /products immediately if already authenticated', () => {
      // Arrange: simulate authenticated state
      authServiceSpy.isAuthenticated.and.returnValue(true);

      // Re-create component so ngOnInit runs with the new spy state
      fixture = TestBed.createComponent(LoginComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      // Assert: navigated to /products
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/products']);
    });

    it('should NOT redirect if user is not authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      fixture = TestBed.createComponent(LoginComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('valid credentials', () => {
    it('should navigate to /products on successful login', fakeAsync(() => {
      // Arrange
      authServiceSpy.login.and.returnValue(of(mockAuthResponse));
      component.loginForm.setValue({ username: 'admin', password: 'admin123' });

      // Act
      component.onSubmit();
      tick();

      // Assert
      expect(authServiceSpy.login).toHaveBeenCalledWith('admin', 'admin123');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/products']);
    }));

    it('should clear any previous error message on successful login', fakeAsync(() => {
      // Arrange: set a pre-existing error
      component.errorMessage = 'Invalid username or password';
      authServiceSpy.login.and.returnValue(of(mockAuthResponse));
      component.loginForm.setValue({ username: 'admin', password: 'admin123' });

      // Act
      component.onSubmit();
      tick();

      // Assert: error cleared before the request and navigation happened
      expect(component.errorMessage).toBe('');
    }));

    it('should set loading to false after successful login', fakeAsync(() => {
      authServiceSpy.login.and.returnValue(of(mockAuthResponse));
      component.loginForm.setValue({ username: 'admin', password: 'admin123' });

      component.onSubmit();
      tick();

      expect(component.loading).toBeFalse();
    }));
  });

  describe('invalid credentials (401 error)', () => {
    it('should display "Invalid username or password" error message on 401', fakeAsync(() => {
      // Arrange
      const error401 = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      authServiceSpy.login.and.returnValue(throwError(() => error401));
      component.loginForm.setValue({ username: 'admin', password: 'wrongpassword' });

      // Act
      component.onSubmit();
      tick();

      // Assert
      expect(component.errorMessage).toBe('Invalid username or password');
    }));

    it('should NOT navigate away from /login on 401 error', fakeAsync(() => {
      // Arrange
      const error401 = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      authServiceSpy.login.and.returnValue(throwError(() => error401));
      component.loginForm.setValue({ username: 'admin', password: 'wrongpassword' });

      // Act
      component.onSubmit();
      tick();

      // Assert: router.navigate was never called
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));

    it('should display the error message in the template on 401', () => {
      // Arrange — throwError emits synchronously, no fakeAsync needed
      const error401 = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      authServiceSpy.login.and.returnValue(throwError(() => error401));
      component.loginForm.setValue({ username: 'admin', password: 'wrongpassword' });

      // Act
      component.onSubmit();
      fixture.detectChanges();

      // Assert: error element is rendered in the DOM
      const errorEl: HTMLElement | null = fixture.nativeElement.querySelector('[data-testid="error-message"]');
      expect(errorEl).not.toBeNull();
      expect(errorEl?.textContent).toContain('Invalid username or password');
    });

    it('should set loading to false after 401 error', fakeAsync(() => {
      const error401 = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      authServiceSpy.login.and.returnValue(throwError(() => error401));
      component.loginForm.setValue({ username: 'admin', password: 'wrongpassword' });

      component.onSubmit();
      tick();

      expect(component.loading).toBeFalse();
    }));

    it('should display a generic error message for non-401 errors', fakeAsync(() => {
      const error500 = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });
      authServiceSpy.login.and.returnValue(throwError(() => error500));
      component.loginForm.setValue({ username: 'admin', password: 'admin123' });

      component.onSubmit();
      tick();

      expect(component.errorMessage).toBe('An error occurred. Please try again.');
    }));
  });

  describe('form validation', () => {
    it('should not call login when form is invalid (empty fields)', () => {
      component.loginForm.setValue({ username: '', password: '' });
      component.onSubmit();
      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('should not call login when username is missing', () => {
      component.loginForm.setValue({ username: '', password: 'admin123' });
      component.onSubmit();
      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('should not call login when password is missing', () => {
      component.loginForm.setValue({ username: 'admin', password: '' });
      component.onSubmit();
      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });
  });
});
