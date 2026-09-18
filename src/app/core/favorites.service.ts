import { ToastService } from './toast.service';
import { Injectable, inject, signal } from '@angular/core';
import { Movie } from '../shared/movie-card/movie-card.component';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly toast = inject(ToastService);
  private readonly storageKey = 'cinema-favorites';
  readonly movies = signal<Movie[]>(this.readMovies());

  isFavorite(movie: Movie): boolean {
    return this.movies().some(item => item.title === movie.title);
  }

  toggle(movie: Movie): void {
    const removing = this.isFavorite(movie);
    const movies = removing
      ? this.movies().filter(item => item.title !== movie.title)
      : [...this.movies(), movie];
    this.movies.set(movies);
    localStorage.setItem(this.storageKey, JSON.stringify(movies));
    this.toast.show(removing ? 'toast.favoriteRemoved' : 'toast.favoriteAdded', removing ? 'info' : 'success');
  }

  private readMovies(): Movie[] {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) ?? '[]') as Movie[];
    } catch {
      return [];
    }
  }
}
