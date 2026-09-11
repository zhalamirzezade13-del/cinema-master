import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';

import {
  collection,
  getDocs,
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
    return from(getDocs(collection(db, 'movies'))).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as Movie))
      )
    );
  }

  getNowPlaying(): Observable<Movie[]> {
    const moviesQuery = query(
      collection(db, 'movies'),
      where('status', '==', 'now_playing')
    );

    return from(getDocs(moviesQuery)).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Movie))
      )
    );
  }

  getUpcoming(): Observable<Movie[]> {
    const moviesQuery = query(
      collection(db, 'movies'),
      where('status', '==', 'upcoming')
    );

    return from(getDocs(moviesQuery)).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Movie))
      )
    );
  }
}
