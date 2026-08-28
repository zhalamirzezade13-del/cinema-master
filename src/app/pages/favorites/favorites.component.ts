import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../core/favorites.service';
import { MovieCardComponent } from '../../shared/movie-card/movie-card.component';
import { TranslocoPipe } from '@jsverse/transloco';
@Component({
  selector: 'app-favorites',
  imports: [CommonModule, RouterLink, MovieCardComponent, TranslocoPipe],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css'
})
export class FavoritesComponent {
  constructor(public readonly favorites: FavoritesService) {}
}
