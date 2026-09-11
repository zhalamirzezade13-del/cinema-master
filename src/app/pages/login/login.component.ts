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
  email = '';
  password = '';
  showPassword = false;
  loginError = false;
  get returnUrl(): string | null { return this.route.snapshot.queryParamMap.get('returnUrl'); }

  constructor(
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
      return;
    }

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
}