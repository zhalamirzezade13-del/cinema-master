import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MovieCardComponent, type Movie } from '../../shared/movie-card/movie-card.component';
import { TranslocoPipe } from '@jsverse/transloco';
@Component({
  selector: 'app-movies',
  imports: [CommonModule, MovieCardComponent, TranslocoPipe],
  templateUrl: './movies.component.html',
  styleUrl: './movies.component.css'
})
export class MoviesComponent {
  movies: Movie[] = [
    {
      title: 'Avatar: Fire and Ash',
      poster: 'https://image.tmdb.org/t/p/original/8kknNk7PbOcDUXynUZYZ7EHnKAA.jpg',
      rating: 8.2,
      genre: 'Action, Adventure, Fantasy',
      duration: '3h 12m',
      description: 'Jake Sully and Neytiri face a fierce new Na’vi clan as Pandora is drawn into a conflict that tests their family and their home.',
    },
    {
      title: 'Super-Man',
      poster: 'https://image.tmdb.org/t/p/original/mndGq35yDCm8QSuTKRdF2o0KkB7.jpg',
      rating: 8.2,
      genre: 'Action, Adventure, Fantasy',
      duration: '3h 12m',
      description: 'A young Clark Kent learns to balance his extraordinary powers with his human upbringing while becoming a symbol of hope.',
    },
    {
      title: 'The Batman Part II',
      poster: 'https://www.dvdsreleasedates.com/images/orig/T/The-Batman-Part-II-2026.jpg',
      rating: 7.8,
      genre: 'Crime, Action, Thriller',
      duration: '2h 45m',
      description: 'Batman returns to Gotham’s shadows to investigate a dangerous new criminal threat that pushes his detective skills to the limit.',
    },
    {
      title: 'Mission: Impossible – The Final Reckoning',
      poster: 'https://image.tmdb.org/t/p/original/qH84QkFVLdB2ozlsyMjRr1Umw8w.jpg',
      rating: 7.4,
      genre: 'Action, Adventure, Spy',
      duration: '2h 49m',
      description: 'Ethan Hunt and the IMF race against time on their most personal mission yet, where the fate of the world hangs in the balance.',
    },
    {
      title: 'F1',
      poster: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSr2SgmDLkFhLGuF1CnP_xJv1stiKvK027DkN6m6wdqdg&s=10',
      rating: 7.6,
      genre: 'Drama, Action, Sport',
      duration: '2h 35m',
      description: 'A former Formula 1 driver returns to the grid to mentor a rising teammate and help an underdog team compete at the highest level.',
    },
    {
      title: 'Jurassic World Rebirth',
      poster: 'https://m.media-amazon.com/images/M/MV5BNjg2NTcwYWQtYzk4NS00MTJhLWEzZjItMzIxNjk3YzlkYzU0XkEyXkFqcGc@._V1_.jpg',
      rating: 7.1,
      genre: 'Adventure, Science Fiction',
      duration: '2h 14m',
      description: 'An expedition ventures to a remote island in search of rare dinosaur DNA, only to uncover threats far beyond their expectations.',
    },
    {
      title: 'The Fantastic Four: First Steps',
      poster: 'https://m.media-amazon.com/images/I/71tqU9jIUAL._AC_UF350,350_QL80_.jpg',
      rating: 7.5,
      genre: 'Action, Adventure, Science Fiction',
      duration: '1h 55m',
      description: 'Four explorers gain incredible abilities and must become a family as they protect their world from a cosmic force.',
    },
    {
      title: 'How to Train Your Dragon',
      poster: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSL94-7LcBuyGDzKvpPplZbp-8iMuC4ydmobWegS9v9Jg&s=10',
      rating: 7.7,
      genre: 'Family, Adventure, Fantasy',
      duration: '2h 05m',
      description: 'A resourceful Viking teenager forms an unlikely friendship with a dragon, changing the future of his island forever.',
    },
    {
      title: 'Thunderbolts*',
      poster: 'https://image.tmdb.org/t/p/original/m9EtP1Yrzv6v7dMaC9mRaGhd1um.jpg',
      rating: 7.3,
      genre: 'Action, Adventure, Crime',
      duration: '2h 06m',
      description: 'A group of conflicted antiheroes is sent on a high-risk mission that forces them to confront the darkest parts of their past.',
    },
    {
      title: 'Lilo & Stitch',
      poster: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3mwGpyBKGZGQqlLwIy4pCKD5DKxgRgiEb_gslc1spnJiySoPVn7HaAC8&s=10',
      rating: 7.0,
      genre: 'Family, Comedy, Science Fiction',
      duration: '1h 48m',
      description: 'A lonely Hawaiian girl and a chaotic alien experiment discover that family means no one gets left behind.',
    },
    {
      title: 'Ballerina',
      poster: 'https://image.tmdb.org/t/p/original/2VUmvqsHb6cEtdfscEA6fqqVzLg.jpg',
      rating: 7.2,
      genre: 'Action, Thriller',
      duration: '2h 05m',
      description: 'A gifted assassin pursues vengeance after a devastating loss, entering a dangerous world of elite killers and impossible choices.',
    },
  ];
}
