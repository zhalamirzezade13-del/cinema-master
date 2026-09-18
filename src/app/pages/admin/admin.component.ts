import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AdminDataService, adminError } from './admin-data.service';
import { Movie } from '../../shared/movie-card/movie-card.component';
import { youtubeVideoId } from '../../core/youtube';

@Component({
  selector: 'app-admin',
  imports: [
    CommonModule,
    TranslocoPipe,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
    
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {

  movies: Movie[] = [];

  loading = true;
  saving = false;
  deleting = false;
  error = '';
  notice = '';

  get showDashboard(): boolean {
    return this.route.snapshot.children.every(child => child.outlet !== 'primary');
  }

  get pageTitle(): string {
    const page = this.router.url.split('?')[0].split('/')[2] ?? '';
    return ({ history: 'activity.title', movies: 'admin.movies', bookings: 'admin.bookings', comments: 'admin.comments', halls: 'admin.hallsSessions', messages: 'admin.messages', users: 'admin.users' } as Record<string, string>)[page] ?? 'admin.dashboard';
  }

  showForm = false;
  editingMovieId: string | null = null;

  form: Movie = {
    title: '',
    poster: '',
    rating: 0,
    genre: '',
    duration: '',
    description: '',
    trailerUrl: '',
    releaseDate: '',
    status: 'now_playing'
  };

  constructor(
    public readonly transloco: TranslocoService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly data: AdminDataService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  setLanguage(lang: 'az' | 'en'): void {
    localStorage.setItem('language', lang);

    this.transloco.setActiveLang(lang);

    document.documentElement.lang = lang;
  }

  getNowPlayingCount(): number {
    return this.movies.filter(
      movie => movie.status === 'now_playing'
    ).length;
  }

  getUpcomingCount(): number {
    return this.movies.filter(
      movie => movie.status === 'upcoming'
    ).length;
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }

  async ngOnInit(): Promise<void> {
    await this.loadMovies();
  }

  async loadMovies(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      this.movies = await this.data.list('movies') as unknown as Movie[];
    } catch (error) {
      this.error = adminError(error);
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  openAddForm(): void {
    this.error = '';
    this.notice = '';
    this.editingMovieId = null;

    this.form = {
      title: '',
      poster: '',
      rating: 0,
      genre: '',
      duration: '',
      description: '',
      trailerUrl: '',
      releaseDate: '',
      status: 'now_playing'
    };

    this.showForm = true;
  }

  openEditForm(movie: Movie): void {
    this.error = '';
    this.notice = '';
    if (!movie.id) {
      this.error = 'admin.movieIdError';
      return;
    }
    this.editingMovieId =
      movie.id ?? null;

    this.form = {
      ...movie
    };

    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingMovieId = null;
  }

  async saveMovie(): Promise<void> {
    if (this.saving) return;
    this.error = '';
    const movieData = {
      title: this.form.title.trim(), poster: this.form.poster.trim(),
      genre: this.form.genre.trim(),
      duration: this.form.duration.trim(), description: this.form.description ?? '',
      trailerUrl: this.form.trailerUrl?.trim() ?? '',
      releaseDate: this.form.releaseDate ?? '', status: this.form.status
    };
    if (!movieData.title || !movieData.poster || !movieData.genre || !movieData.duration ||
        !movieData.releaseDate) {
      this.error = 'admin.movieValidation';
      return;
    }
    if (movieData.trailerUrl && !youtubeVideoId(movieData.trailerUrl)) {
      this.error = 'admin.trailerValidation';
      return;
    }
    this.saving = true;
    try {
      const id = await this.data.save('movies', this.editingMovieId, movieData);
      const saved: Movie = { ...movieData, id, rating: this.editingMovieId ? this.form.rating : 0 };
      this.movies = this.editingMovieId
        ? this.movies.map(movie => movie.id === id ? saved : movie)
        : [...this.movies, saved];
      this.notice = 'admin.movieSaved';
      this.closeForm();
    } catch (error) {
      this.error = adminError(error);
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  // Called only after the movie page's confirmation dialog is accepted.
  async deleteMovie(movie: Movie): Promise<boolean> {
    if (this.deleting || !movie.id) return false;
    this.deleting = true;
    this.error = '';
    this.notice = '';
    try {
      await this.data.remove('movies', movie.id);
      this.movies = this.movies.filter(item => item.id !== movie.id);
      this.notice = 'admin.movieDeleted';
      return true;
    } catch (error) {
      this.error = adminError(error);
      return false;
    } finally {
      this.deleting = false;
      this.cdr.markForCheck();
    }
  }
}
