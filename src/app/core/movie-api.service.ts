import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';

import {
  collection,
  DocumentData,
  getDocs,
  Query,
  query,
  where
} from 'firebase/firestore';

import { db } from './firebase';

import {
  Movie
} from '../shared/movie-card/movie-card.component';

@Injectable({
  providedIn: 'root'
})
export class MovieApiService {

  getAllMovies(): Observable<Movie[]> {
    return this.getMovies(collection(db, 'movies'));
  }

  getNowPlaying(): Observable<Movie[]> {
    const moviesQuery = query(
      collection(db, 'movies'),
      where('status', '==', 'now_playing')
    );

    return this.getMovies(moviesQuery);
  }

  getUpcoming(): Observable<Movie[]> {
    const moviesQuery = query(
      collection(db, 'movies'),
      where('status', '==', 'upcoming')
    );

    return this.getMovies(moviesQuery);
  }

  private getMovies(moviesQuery: Query<DocumentData>): Observable<Movie[]> {
    const approvedComments = query(collection(db, 'comments'), where('status', '==', 'approved'));
    return from(Promise.all([getDocs(moviesQuery), getDocs(approvedComments)])).pipe(
      map(([movies, comments]) => {
        const ratings = new Map<string, { total: number; count: number }>();
        for (const comment of comments.docs) {
          const { movieKey, rating } = comment.data();
          if (typeof movieKey !== 'string' || !Number.isInteger(rating) || rating < 1 || rating > 10) continue;
          const entry = ratings.get(movieKey) ?? { total: 0, count: 0 };
          entry.total += rating;
          entry.count++;
          ratings.set(movieKey, entry);
        }
        return movies.docs.map(movie => {
          const data = movie.data();
          const votes = ratings.get(movie.id) ?? ratings.get(`title:${data['title']}`);
          return {
            ...data,
            id: movie.id,
            rating: votes ? Math.round((votes.total / votes.count) * 10) / 10 : 0
          } as Movie;
        });
      })
    );
  }
}
