import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import {
  MovieCardComponent,
  type Movie
} from '../../shared/movie-card/movie-card.component';

import { MovieApiService } from '../../core/movie-api.service';

@Component({
  selector: 'app-movies',
  imports: [
    CommonModule,
    MovieCardComponent,
    TranslocoPipe
  ],
  templateUrl: './movies.component.html',
  styleUrl: './movies.component.css'
})
export class MoviesComponent implements OnInit {
  movies: Movie[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private readonly movieApi: MovieApiService
  ) {}

  ngOnInit(): void {
    this.movieApi.getNowPlaying().subscribe({
      next: movies => {
        this.movies = movies;
        this.loading = false;
      },
      error: error => {
        console.error('TMDB API error:', error);
        this.errorMessage =
          'Filmlər yüklənə bilmədi.';
        this.loading = false;
      }
    });
  }
}