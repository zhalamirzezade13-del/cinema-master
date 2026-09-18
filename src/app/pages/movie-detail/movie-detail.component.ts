import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MovieFeedbackComponent } from './feedback/movie-feedback.component';
import { TheatreComponent } from '../theatre/theatre.component';
import { youtubeVideoId } from '../../core/youtube';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-movie-detail',
  imports: [CommonModule, RouterLink, TheatreComponent, MovieFeedbackComponent, TranslocoPipe],
  templateUrl: './movie-detail.component.html',
  styleUrl: './movie-detail.component.css'
})
export class MovieDetailComponent {
  movie = { title: 'Movie', poster: '', rating: '', genre: '', duration: '', description: '' };
  private readonly sanitizer = inject(DomSanitizer);
  trailerEmbedUrl: SafeResourceUrl | null = null;
  trailerOpen = false;
  hallId = 1;
  movieId = '';

  private readonly movieHalls: Record<string, number> = {
    'Avatar: Fire and Ash': 1,
    'Super-Man': 2,
    'The Batman Part II': 3,
    'Mission: Impossible – The Final Reckoning': 1,
    'F1': 2,
    'Jurassic World Rebirth': 4,
    'The Fantastic Four: First Steps': 1,
    'How to Train Your Dragon': 4,
    'Thunderbolts*': 2,
    'Lilo & Stitch': 4,
    'Ballerina': 3
  };

  constructor(route: ActivatedRoute) {
    route.queryParamMap.subscribe(params => {
      this.movieId = params.get('id') ?? '';
      this.movie = {
        title: params.get('title') ?? 'Movie',
        poster: params.get('poster') ?? '',
        rating: '',
        genre: params.get('genre') ?? '',
        duration: params.get('duration') ?? '',
        description: params.get('description') ?? 'A short description for this film is not available yet.'
      };
      this.hallId = this.movieHalls[this.movie.title] ?? 1;
      const videoId = youtubeVideoId(params.get('trailerUrl') ?? '');
      this.trailerEmbedUrl = videoId
        ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${videoId}`)
        : null;
      this.trailerOpen = false;
    });
  }

  updateRating(rating: number | null): void {
    this.movie.rating = rating === null ? '' : String(rating);
  }
}
