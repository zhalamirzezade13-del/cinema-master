import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { FavoritesService } from '../../core/favorites.service';

@Component({
  selector: 'app-movie-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './movie-card.component.html',
  styleUrl: './movie-card.component.css'
})
export class MovieCardComponent {
  @Input() movie!: Movie;

  constructor(
    public readonly auth: AuthService,
    public readonly favorites: FavoritesService,
    private readonly router: Router
  ) {}

  toggleFavorite(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.favorites.toggle(this.movie);
  }
}

export interface Movie {
  title: string;
  poster: string;
  rating: number;
  genre: string;
  duration: string;
  description?: string;
}
