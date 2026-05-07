import {
  Directive,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUser } from '../../core/models/auth.models';

/**
 * Structural directive that conditionally renders its host element based on
 * the current user's role.
 *
 * Usage:
 *   <button *appHasRole="'ADMIN'">Admin only</button>
 *   <button *appHasRole="['ADMIN', 'USER']">Any authenticated user</button>
 *
 * The element is added to the DOM when the current user's role matches one of
 * the required roles, and removed otherwise. The view updates reactively
 * whenever `AuthService.currentUser$` emits a new value.
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
  /** The required role(s). Accepts a single string or an array of strings. */
  private requiredRoles: string[] = [];

  private subscription: Subscription | null = null;

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  @Input('appHasRole')
  set appHasRole(role: string | string[]) {
    this.requiredRoles = Array.isArray(role) ? role : [role];
    // Re-evaluate visibility immediately when the input changes
    this.updateView(this.authService.currentUser$.getValue());
  }

  ngOnInit(): void {
    this.subscription = this.authService.currentUser$.subscribe(
      (user: CurrentUser | null) => this.updateView(user)
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Shows or hides the host element based on whether the current user's role
   * is included in the required roles list.
   */
  private updateView(user: CurrentUser | null): void {
    const hasRole =
      user !== null && this.requiredRoles.includes(user.role);

    if (hasRole) {
      // Only create the view if it is not already rendered
      if (this.viewContainer.length === 0) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      this.viewContainer.clear();
    }
  }
}
