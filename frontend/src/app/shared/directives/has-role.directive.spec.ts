import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import * as fc from 'fast-check';

import { HasRoleDirective } from './has-role.directive';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUser } from '../../core/models/auth.models';

// ─── Test Host Component ─────────────────────────────────────────────────────

@Component({
  template: `<span *appHasRole="requiredRole" id="target">visible</span>`,
  standalone: true,
  imports: [HasRoleDirective]
})
class TestHostComponent {
  requiredRole: string | string[] = 'ADMIN';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeUser(role: string): CurrentUser {
  return { userId: 1, username: 'testuser', role };
}

function isVisible(fixture: ComponentFixture<TestHostComponent>): boolean {
  return fixture.nativeElement.querySelector('#target') !== null;
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('HasRoleDirective', () => {
  let currentUser$: BehaviorSubject<CurrentUser | null>;
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(async () => {
    currentUser$ = new BehaviorSubject<CurrentUser | null>(null);

    const authServiceStub: Partial<AuthService> = {
      currentUser$
    };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        { provide: AuthService, useValue: authServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Property 6: Role directive correctly gates visibility
  // Validates: Requirements 6.1, 6.2, 6.3
  // ═══════════════════════════════════════════════════════════════════════════

  it('Property 6: renders element if and only if the user role matches the required role', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (userRole, requiredRole) => {
          component.requiredRole = requiredRole;
          currentUser$.next(makeUser(userRole));
          fixture.detectChanges();

          const shouldBeVisible = userRole === requiredRole;
          expect(isVisible(fixture)).toBe(shouldBeVisible);
        }
      ),
      { numRuns: 200 }
    );
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Task 16.2 — Unit tests for HasRoleDirective
  // ═══════════════════════════════════════════════════════════════════════════

  describe('element rendering for matching role', () => {
    it('should render the element when the user has the required role', () => {
      component.requiredRole = 'ADMIN';
      currentUser$.next(makeUser('ADMIN'));
      fixture.detectChanges();

      expect(isVisible(fixture)).toBeTrue();
    });

    it('should render the element when the user has one of the required roles (array input)', () => {
      component.requiredRole = ['ADMIN', 'USER'];
      currentUser$.next(makeUser('USER'));
      fixture.detectChanges();

      expect(isVisible(fixture)).toBeTrue();
    });

    it('should render the element when the user has ADMIN and ADMIN is in the required array', () => {
      component.requiredRole = ['ADMIN', 'USER'];
      currentUser$.next(makeUser('ADMIN'));
      fixture.detectChanges();

      expect(isVisible(fixture)).toBeTrue();
    });
  });

  describe('element removal for non-matching role', () => {
    it('should NOT render the element when the user has a different role', () => {
      component.requiredRole = 'ADMIN';
      currentUser$.next(makeUser('USER'));
      fixture.detectChanges();

      expect(isVisible(fixture)).toBeFalse();
    });

    it('should NOT render the element when no user is authenticated (null)', () => {
      component.requiredRole = 'ADMIN';
      currentUser$.next(null);
      fixture.detectChanges();

      expect(isVisible(fixture)).toBeFalse();
    });

    it('should NOT render the element when the user role is not in the required array', () => {
      component.requiredRole = ['ADMIN'];
      currentUser$.next(makeUser('USER'));
      fixture.detectChanges();

      expect(isVisible(fixture)).toBeFalse();
    });
  });

  describe('reactive updates when currentUser$ emits a new value', () => {
    it('should show the element when a matching user is emitted after a non-matching one', () => {
      component.requiredRole = 'ADMIN';
      fixture.detectChanges();

      currentUser$.next(makeUser('USER'));
      fixture.detectChanges();
      expect(isVisible(fixture)).toBeFalse();

      currentUser$.next(makeUser('ADMIN'));
      fixture.detectChanges();
      expect(isVisible(fixture)).toBeTrue();
    });

    it('should hide the element when a non-matching user is emitted after a matching one', () => {
      component.requiredRole = 'ADMIN';
      fixture.detectChanges();

      currentUser$.next(makeUser('ADMIN'));
      fixture.detectChanges();
      expect(isVisible(fixture)).toBeTrue();

      currentUser$.next(makeUser('USER'));
      fixture.detectChanges();
      expect(isVisible(fixture)).toBeFalse();
    });

    it('should hide the element when the user logs out (null emitted)', () => {
      component.requiredRole = 'ADMIN';

      currentUser$.next(makeUser('ADMIN'));
      fixture.detectChanges();
      expect(isVisible(fixture)).toBeTrue();

      currentUser$.next(null);
      fixture.detectChanges();
      expect(isVisible(fixture)).toBeFalse();
    });

    it('should show the element when the user logs in after being unauthenticated', () => {
      component.requiredRole = 'USER';

      currentUser$.next(null);
      fixture.detectChanges();
      expect(isVisible(fixture)).toBeFalse();

      currentUser$.next(makeUser('USER'));
      fixture.detectChanges();
      expect(isVisible(fixture)).toBeTrue();
    });
  });
});
