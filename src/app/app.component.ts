import { ToastComponent } from './shared/toast/toast.component';
import { Component, signal } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterOutlet
} from '@angular/router';

import { filter } from 'rxjs';

import { NavbarComponent } from './shared/navbar/navbar.component';
import { AuthService } from './core/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [
    RouterOutlet,
    NavbarComponent,
    ToastComponent,
    CommonModule
  ],
})
export class AppComponent {

  readonly isAdminArea = signal(false);
  readonly isAuthPage = signal(false);

  constructor(
    public readonly auth: AuthService,
    private readonly router: Router
  ) {
    this.updateAdminArea();

    this.router.events
      .pipe(
        filter(
          event => event instanceof NavigationEnd
        )
      )
      .subscribe(() => {
        this.updateAdminArea();
      });
  }

  private updateAdminArea(): void {
    const path = this.router.url.split(/[?#]/)[0];
    this.isAuthPage.set(path === '/login' || path === '/register');
    this.isAdminArea.set(
      this.router.url.startsWith('/admin')
    );
  }
}
