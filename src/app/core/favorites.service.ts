import { Injectable, signal } from '@angular/core';
import { Movie } from '../shared/movie-card/movie-card.component';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly storageKey = 'cinema-favorites';
  readonly movies = signal<Movie[]>(this.readMovies());

  isFavorite(movie: Movie): boolean {
    return this.movies().some(item => item.title === movie.title);
  }

  toggle(movie: Movie): void {
    const movies = this.isFavorite(movie)
      ? this.movies().filter(item => item.title !== movie.title)
      : [...this.movies(), movie];
    this.movies.set(movies);
    localStorage.setItem(this.storageKey, JSON.stringify(movies));
  }

  private readMovies(): Movie[] {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) ?? '[]') as Movie[];
    } catch {
      return [];
    }
  }
}
