import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslocoPipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  language: 'AZE' | 'ENG' = 'AZE';
  languageMenuOpen = false;
  mobileMenuOpen = false;

  constructor(public readonly auth: AuthService, 
    public readonly cart: CartService, 
    public readonly transloco: TranslocoService) {

      const savedLanguage = localStorage.getItem('language') || 'az';

      this.language = 
      savedLanguage === 'en' ? 'ENG' : 'AZE';

      this.transloco.setActiveLang(savedLanguage);

    
    }

  toggleLanguageMenu(): void {
    this.languageMenuOpen = !this.languageMenuOpen;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (!this.mobileMenuOpen) this.languageMenuOpen = false;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    this.languageMenuOpen = false;
  }

  setLanguage(language: 'AZE' | 'ENG'): void {
  this.language = language;
  this.languageMenuOpen = false;

  const langCode = language === 'AZE' ? 'az' : 'en';

  localStorage.setItem('language', langCode);
  this.transloco.setActiveLang(langCode);
  document.documentElement.lang = langCode;
  this.closeMobileMenu();
}
}
