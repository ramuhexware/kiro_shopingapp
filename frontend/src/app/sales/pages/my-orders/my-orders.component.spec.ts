import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { MyOrdersComponent } from './my-orders.component';
import { ApiService, SaleResponse } from '../../../core/services/api.service';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeSale(overrides: Partial<SaleResponse> = {}): SaleResponse {
  return {
    saleId: 1,
    soldAt: '2024-01-15T10:30:00Z',
    totalAmount: 99.99,
    items: [
      { productId: 1, quantity: 2, unitPrice: 49.99, lineTotal: 99.98 }
    ],
    userId: 1,
    ...overrides
  };
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe('MyOrdersComponent', () => {
  let component: MyOrdersComponent;
  let fixture: ComponentFixture<MyOrdersComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj<ApiService>('ApiService', ['getMyOrders']);

    await TestBed.configureTestingModule({
      imports: [
        MyOrdersComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MyOrdersComponent);
    component = fixture.componentInstance;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Table renders correct rows from API response
  // ═══════════════════════════════════════════════════════════════════════════

  describe('when the API returns a list of orders', () => {
    const mockOrders: SaleResponse[] = [
      makeSale({
        saleId: 101,
        soldAt: '2024-03-10T14:00:00Z',
        totalAmount: 150.00,
        items: [
          { productId: 1, quantity: 1, unitPrice: 50.00, lineTotal: 50.00 },
          { productId: 2, quantity: 1, unitPrice: 50.00, lineTotal: 50.00 },
          { productId: 3, quantity: 1, unitPrice: 50.00, lineTotal: 50.00 }
        ]
      }),
      makeSale({
        saleId: 102,
        soldAt: '2024-02-20T09:15:00Z',
        totalAmount: 49.99,
        items: [
          { productId: 2, quantity: 1, unitPrice: 49.99, lineTotal: 49.99 }
        ]
      })
    ];

    beforeEach(fakeAsync(() => {
      apiServiceSpy.getMyOrders.and.returnValue(of(mockOrders));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should call getMyOrders on init', () => {
      expect(apiServiceSpy.getMyOrders).toHaveBeenCalledTimes(1);
    });

    it('should render one table row per order', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr[mat-row]'));
      expect(rows.length).toBe(2);
    });

    it('should display the Sale ID in the first column', () => {
      const cells = fixture.debugElement.queryAll(By.css('td[mat-cell]'));
      expect(cells[0].nativeElement.textContent).toContain('101');
    });

    it('should display the Total Amount formatted as currency', () => {
      const cells = fixture.debugElement.queryAll(By.css('td[mat-cell]'));
      expect(cells[2].nativeElement.textContent).toContain('150');
    });

    it('should display the item count for each order', () => {
      const cells = fixture.debugElement.queryAll(By.css('td[mat-cell]'));
      expect(cells[3].nativeElement.textContent.trim()).toBe('3');
      expect(cells[7].nativeElement.textContent.trim()).toBe('1');
    });

    it('should NOT show the empty-state message', () => {
      const emptyState = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState).toBeNull();
    });

    it('should NOT show the error-state message', () => {
      const errorState = fixture.debugElement.query(By.css('.error-state'));
      expect(errorState).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Empty state — API returns an empty array
  // ═══════════════════════════════════════════════════════════════════════════

  describe('when the API returns an empty array', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getMyOrders.and.returnValue(of([]));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should show the empty-state message', () => {
      const emptyState = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState).not.toBeNull();
      expect(emptyState.nativeElement.textContent).toContain('No orders have been placed yet.');
    });

    it('should NOT render any table rows', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr[mat-row]'));
      expect(rows.length).toBe(0);
    });

    it('should NOT show the error-state message', () => {
      const errorState = fixture.debugElement.query(By.css('.error-state'));
      expect(errorState).toBeNull();
    });

    it('should NOT show the table', () => {
      const table = fixture.debugElement.query(By.css('table[mat-table]'));
      expect(table).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Error state — API call fails
  // ═══════════════════════════════════════════════════════════════════════════

  describe('when the API call fails', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getMyOrders.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should show the error-state message', () => {
      const errorState = fixture.debugElement.query(By.css('.error-state'));
      expect(errorState).not.toBeNull();
      expect(errorState.nativeElement.textContent).toContain('Failed to load orders. Please try again.');
    });

    it('should NOT show the empty-state message', () => {
      const emptyState = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState).toBeNull();
    });

    it('should NOT render any table rows', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr[mat-row]'));
      expect(rows.length).toBe(0);
    });

    it('should NOT show the table', () => {
      const table = fixture.debugElement.query(By.css('table[mat-table]'));
      expect(table).toBeNull();
    });

    it('should set error flag to true', () => {
      expect(component.error).toBeTrue();
    });

    it('should set loading flag to false after failure', () => {
      expect(component.loading).toBeFalse();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Loading state
  // ═══════════════════════════════════════════════════════════════════════════

  describe('loading state', () => {
    it('should set loading to false after a successful response', fakeAsync(() => {
      apiServiceSpy.getMyOrders.and.returnValue(of([makeSale()]));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.loading).toBeFalse();
    }));
  });
});
