import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly demoEmail = 'admin@gmail.com';
  private readonly demoPassword = '1234';
  readonly isLoggedIn = signal(sessionStorage.getItem('cinema-user') === 'logged-in');

  login(email: string, password: string): boolean {
    if (email !== this.demoEmail || password !== this.demoPassword) {
      return false;
    }

    sessionStorage.setItem('cinema-user', 'logged-in');
    this.isLoggedIn.set(true);
    return true;
  }

  logout(): void {
    sessionStorage.removeItem('cinema-user');
    this.isLoggedIn.set(false);
  }
}
