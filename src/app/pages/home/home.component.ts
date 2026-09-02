import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import {
  MovieCardComponent,
  type Movie
} from '../../shared/movie-card/movie-card.component';

import {
  HeroSliderComponent
} from '../../shared/hero-slider/hero-slider.component';

import {
  MovieApiService
} from '../../core/movie-api.service';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    HeroSliderComponent,
    RouterLink,
    MovieCardComponent,
    TranslocoPipe
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  nowShowing: Movie[] = [];
  comingSoon: Movie[] = [];

  loadingNowShowing = true;
  loadingComingSoon = true;
  errorMessage = '';

  constructor(
    private readonly movieApi: MovieApiService
  ) {}

  ngOnInit(): void {
    this.loadNowShowing();
    this.loadComingSoon();
  }

  private loadNowShowing(): void {
    this.movieApi.getNowPlaying().subscribe({
      next: movies => {
        this.nowShowing = movies.slice(0, 4);
        this.loadingNowShowing = false;
      },
      error: error => {
        console.error('Now playing API error:', error);
        this.errorMessage =
          'Hazırda göstərilən filmlər yüklənə bilmədi.';
        this.loadingNowShowing = false;
      }
    });
  }

  private loadComingSoon(): void {
    this.movieApi.getUpcoming().subscribe({
      next: movies => {
        this.comingSoon = movies.slice(0, 4);
        this.loadingComingSoon = false;
      },
      error: error => {
        console.error('Upcoming API error:', error);
        this.errorMessage =
          'Gələcək filmlər yüklənə bilmədi.';
        this.loadingComingSoon = false;
      }
    });
  }
}