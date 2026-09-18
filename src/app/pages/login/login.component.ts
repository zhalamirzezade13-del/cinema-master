import { ToastService } from '../../core/toast.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, TranslocoPipe, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  resetOpen = false;
  resetEmail = '';
  resetBusy = false;
  resetStatus = '';
  resetError = false;

  async resetPassword(): Promise<void> {
    if (this.resetBusy) return;
    this.resetBusy = true;
    this.resetStatus = '';
    this.resetError = false;
    try {
      await this.auth.resetPassword(this.resetEmail);
      this.resetStatus = 'settings.resetSent';
    } catch { this.resetError = true; this.resetStatus = 'settings.resetError'; }
    finally { this.toast.show(this.resetStatus, this.resetError ? 'error' : 'success'); this.resetBusy = false; }
  }

  email = '';
  password = '';
  showPassword = false;
  loginError = false;
  socialBusy = false;
  socialError = '';
  socialErrorCode = '';
  get returnUrl(): string | null { return this.route.snapshot.queryParamMap.get('returnUrl'); }

  constructor(
    private readonly toast: ToastService,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  async login(): Promise<void> {
    const success = await this.auth.login(
      this.email,
      this.password
    );

    this.loginError = !success;

    if (!success) {
      this.toast.show('login.error', 'error');
      return;
    }

    this.toast.show('toast.loginSuccess');
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl?.startsWith('/movie?')) {
      await this.router.navigateByUrl(returnUrl);
      return;
    }

    if (this.auth.isAdmin()) {
      await this.router.navigate(['/admin']);
      return;
    }

    await this.router.navigate(['/movies']);
  }

  async loginWithProvider(provider: 'google' | 'facebook'): Promise<void> {
    if (this.socialBusy) return;
    this.socialBusy = true;
    this.socialError = '';
    this.socialErrorCode = '';
    try {
      await this.auth.loginWithProvider(provider);
      this.toast.show('toast.loginSuccess');
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      if (returnUrl?.startsWith('/movie?')) await this.router.navigateByUrl(returnUrl);
      else if (this.auth.isAdmin()) await this.router.navigate(['/admin']);
      else await this.router.navigate(['/movies']);
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
      const errorKeys: Record<string, string> = {
        'auth/account-exists-with-different-credential': 'login.socialAccountExists',
        'auth/operation-not-allowed': 'login.socialProviderDisabled',
        'auth/unauthorized-domain': 'login.socialUnauthorizedDomain',
        'auth/popup-blocked': 'login.socialPopupBlocked',
        'auth/network-request-failed': 'login.socialNetworkError'
      };
      this.socialError = errorKeys[code ?? ''] ?? 'login.socialError';
      this.socialErrorCode = code ?? '';
      this.toast.show(this.socialError, 'error');
    } finally {
      this.socialBusy = false;
    }
  }
}
