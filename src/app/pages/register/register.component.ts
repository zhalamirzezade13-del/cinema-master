import { ToastService } from '../../core/toast.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink, TranslocoPipe],
  templateUrl: './register.component.html',
  styleUrl: '../login/login.component.css'
})
export class RegisterComponent {
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  name = '';
  email = '';
  password = '';
  showPassword = false;
  confirmPassword = '';
  showConfirmPassword = false;
  saving = false;
  created = false;
  error = '';
  get returnUrl(): string | null { return this.route.snapshot.queryParamMap.get('returnUrl'); }
  get destination(): string { return this.returnUrl?.startsWith('/movie?') ? this.returnUrl : '/movies'; }

  async register(): Promise<void> {
    if (this.saving || this.created) return;
    this.error = '';
    if (!this.name.trim() || this.name.trim().length > 100 || !this.email.trim() || this.password.length < 6) {
      this.error = 'register.validation'; this.toast.show(this.error, 'error'); return;
    }
    if (this.password !== this.confirmPassword) { this.error = 'register.mismatch'; this.toast.show(this.error, 'error'); return; }
    this.saving = true;
    try {
      const profileSaved = await this.auth.register(this.name, this.email, this.password);
      this.created = true;
      this.password = '';
      this.confirmPassword = '';
      if (profileSaved) { this.toast.show('toast.registerSuccess'); await this.router.navigateByUrl(this.destination); }
      else this.error = 'register.profileIncomplete';
    } catch (error) {
      const code = (error as { code?: string })?.code;
      const errors: Record<string, string> = {
        'auth/email-already-in-use': 'emailUsed', 'auth/invalid-email': 'invalidEmail',
        'auth/weak-password': 'weakPassword', 'auth/password-does-not-meet-requirements': 'weakPassword',
        'auth/network-request-failed': 'networkError', 'auth/too-many-requests': 'tooManyRequests'
      };
      this.error = 'register.' + (errors[code ?? ''] ?? 'error');
    } finally { if (this.error) this.toast.show(this.error, 'error'); this.saving = false; this.cdr.markForCheck(); }
  }
}
