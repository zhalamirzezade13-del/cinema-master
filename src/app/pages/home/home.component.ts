import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HeroSliderComponent } from "../../shared/hero-slider/hero-slider.component";
import { RouterLink } from "@angular/router";
import { MovieCardComponent, type Movie } from "../../shared/movie-card/movie-card.component";
import { TranslocoPipe } from "@jsverse/transloco";
@Component({
  selector: 'app-home',
  imports: [CommonModule, HeroSliderComponent, RouterLink, MovieCardComponent, TranslocoPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  nowShowing: Movie[] = [
    {
      title: 'Avatar: Fire and Ash',
      poster: 'https://image.tmdb.org/t/p/original/8kknNk7PbOcDUXynUZYZ7EHnKAA.jpg',
      rating: 8.2,
      genre: 'Action, Adventure, Fantasy',
      duration: '3h 12m',
    },
    {
      title: 'Super-Man',
      poster: 'https://image.tmdb.org/t/p/original/mndGq35yDCm8QSuTKRdF2o0KkB7.jpg',
      rating: 8.2,
      genre: 'Action, Adventure, Fantasy',
      duration: '3h 12m',
    },
  ];

  comingSoon: Movie[] = [
    {
      title: 'The Batman Part II',
      poster: 'https://www.dvdsreleasedates.com/images/orig/T/The-Batman-Part-II-2026.jpg',
      rating: 7.8,
      genre: 'Crime, Action, Thriller',
      duration: '2h 45m',
    },
    {
      title: 'Mission: Impossible – The Final Reckoning',
      poster: 'https://image.tmdb.org/t/p/original/qH84QkFVLdB2ozlsyMjRr1Umw8w.jpg',
      rating: 7.4,
      genre: 'Action, Adventure, Spy',
      duration: '2h 49m',
    },
    {
      title: 'The Fantastic Four: First Steps',
      poster: 'https://m.media-amazon.com/images/I/71tqU9jIUAL._AC_UF350,350_QL80_.jpg',
      rating: 7.5,
      genre: 'Action, Adventure, Science Fiction',
      duration: '1h 55m',
    },
    {
      title: 'How to Train Your Dragon',
      poster: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSL94-7LcBuyGDzKvpPplZbp-8iMuC4ydmobWegS9v9Jg&s=10',
      rating: 7.7,
      genre: 'Family, Adventure, Fantasy',
      duration: '2h 05m',
    }
  ]; 
}
