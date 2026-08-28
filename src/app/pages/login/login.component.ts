import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  loginError = false;

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  login(): void {
    this.loginError = !this.auth.login(this.email, this.password);
    if (!this.loginError) {
      this.router.navigate(['/movies']);
    }
  }
}
