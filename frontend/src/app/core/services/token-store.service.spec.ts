import { TestBed } from '@angular/core/testing';
import { TokenStoreService } from './token-store.service';

describe('TokenStoreService', () => {
  let service: TokenStoreService;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Reset the mock store before each test
    localStorageMock = {};

    // Spy on localStorage methods and redirect to the in-memory mock
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    spyOn(localStorage, 'getItem').and.callFake((key: string): string | null => {
      return Object.prototype.hasOwnProperty.call(localStorageMock, key)
        ? localStorageMock[key]
        : null;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete localStorageMock[key];
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('saveToken', () => {
    it('should write the token to localStorage under the correct key', () => {
      service.saveToken('my.jwt.token');

      expect(localStorage.setItem).toHaveBeenCalledWith('shop_auth_token', 'my.jwt.token');
      expect(localStorageMock['shop_auth_token']).toBe('my.jwt.token');
    });

    it('should overwrite a previously stored token', () => {
      service.saveToken('first.token');
      service.saveToken('second.token');

      expect(localStorageMock['shop_auth_token']).toBe('second.token');
    });
  });

  describe('getToken', () => {
    it('should return null when no token has been stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return the token that was previously saved', () => {
      service.saveToken('my.jwt.token');

      expect(service.getToken()).toBe('my.jwt.token');
    });
  });

  describe('clearToken', () => {
    it('should remove the token from localStorage', () => {
      service.saveToken('my.jwt.token');
      service.clearToken();

      expect(localStorage.removeItem).toHaveBeenCalledWith('shop_auth_token');
      expect(localStorageMock['shop_auth_token']).toBeUndefined();
    });

    it('should not throw when called with no token stored', () => {
      expect(() => service.clearToken()).not.toThrow();
    });
  });

  describe('saveToken / getToken / clearToken round-trip', () => {
    it('should save, retrieve, and then clear a token correctly', () => {
      const token = 'eyJhbGciOiJIUzI1NiJ9.payload.signature';

      // Initially no token
      expect(service.getToken()).toBeNull();

      // Save and retrieve
      service.saveToken(token);
      expect(service.getToken()).toBe(token);

      // Clear and confirm removal
      service.clearToken();
      expect(service.getToken()).toBeNull();
    });
  });
});
