import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Movie } from '../shared/movie-card/movie-card.component';

interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  overview: string;
  release_date: string;
}

interface TmdbResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

@Injectable({
  providedIn: 'root'
})
export class MovieApiService {
  private readonly apiUrl =
    'https://api.themoviedb.org/3';

  private readonly imageUrl =
    'https://image.tmdb.org/t/p/w500';

  constructor(private readonly http: HttpClient) {}

  getNowPlaying(): Observable<Movie[]> {
    return this.getMovies('/movie/now_playing');
  }

  getUpcoming(): Observable<Movie[]> {
    return this.getMovies('/movie/upcoming');
  }

  private getMovies(endpoint: string): Observable<Movie[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${environment.tmdbToken}`,
      accept: 'application/json'
    });

    return this.http
      .get<TmdbResponse>(
        `${this.apiUrl}${endpoint}`,
        {
          headers,
          params: {
            language: 'en-US',
            page: 1
          }
        }
      )
      .pipe(
        map(response =>
          response.results.map(movie => ({
            title: movie.title,
            poster: movie.poster_path
              ? `${this.imageUrl}${movie.poster_path}`
              : '',
            rating: movie.vote_average,
            genre: 'Movie',
            duration: '',
            description: movie.overview
          }))
        )
      );
  }
}