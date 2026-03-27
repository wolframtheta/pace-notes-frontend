import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private rawHttp = new HttpClient(inject(HttpBackend));

  private _token = signal<string | null>(localStorage.getItem(ACCESS_KEY));
  private _user = signal<AuthUser | null>(
    JSON.parse(localStorage.getItem(USER_KEY) ?? 'null')
  );

  private refreshInFlight: Promise<void> | null = null;

  token = this._token.asReadonly();
  user = this._user.asReadonly();
  isAuthenticated = computed(() => !!this._token());

  async login(
    email: string,
    password: string,
    returnUrl?: string | null,
  ): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
    );
    this.setSession(res);
    this.navigateAfterAuth(returnUrl);
  }

  async register(
    email: string,
    password: string,
    name?: string,
    returnUrl?: string | null,
  ): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, {
        email,
        password,
        name,
      })
    );
    this.setSession(res);
    this.navigateAfterAuth(returnUrl);
  }

  /** Uses HttpBackend to avoid interceptor refresh loops. */
  refreshSession(): Promise<void> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      return Promise.reject(new Error('no refresh token'));
    }
    this.refreshInFlight = firstValueFrom(
      this.rawHttp.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {
        refresh_token: refreshToken,
      })
    )
      .then((res) => {
        this.setSession(res);
      })
      .finally(() => {
        this.refreshInFlight = null;
      });
    return this.refreshInFlight;
  }

  logout(): void {
    const token = this._token();
    if (!token) {
      this.clearLocalSession();
      void this.router.navigate(['/login']);
      return;
    }
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
      next: () => {
        this.clearLocalSession();
        void this.router.navigate(['/login']);
      },
      error: () => {
        this.clearLocalSession();
        void this.router.navigate(['/login']);
      },
    });
  }

  private clearLocalSession(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem(ACCESS_KEY, res.access_token);
    localStorage.setItem(REFRESH_KEY, res.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._token.set(res.access_token);
    this._user.set(res.user);
  }

  private navigateAfterAuth(returnUrl?: string | null): void {
    const target = this.sanitizeReturnUrl(returnUrl) ?? '/stages';
    void this.router.navigateByUrl(target);
  }

  private sanitizeReturnUrl(url: string | null | undefined): string | null {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
    return trimmed;
  }
}
