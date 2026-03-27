import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { from } from 'rxjs';
import { AuthService } from '../services/auth.service';

function isAuthExcluded(url: string): boolean {
  const path = url.startsWith('http') ? new URL(url).pathname : url;
  return (
    path.includes('/auth/login') ||
    path.includes('/auth/register') ||
    path.includes('/auth/refresh') ||
    path.includes('/auth/logout')
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) {
        return throwError(() => err);
      }
      if (isAuthExcluded(req.url)) {
        return throwError(() => err);
      }
      if (req.headers.has('X-Retry-After-Refresh')) {
        authService.logout();
        return throwError(() => err);
      }
      return from(authService.refreshSession()).pipe(
        switchMap(() => {
          const newToken = authService.token();
          if (!newToken) {
            authService.logout();
            return throwError(() => err);
          }
          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
              'X-Retry-After-Refresh': '1',
            },
          });
          return next(retryReq);
        }),
        catchError(() => {
          authService.logout();
          return throwError(() => err);
        }),
      );
    }),
  );
};
