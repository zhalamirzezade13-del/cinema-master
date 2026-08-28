import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/cart.service';
import { FavoritesService } from '../../core/favorites.service';
import { MovieCardComponent } from '../../shared/movie-card/movie-card.component';
import { TranslocoPipe } from '@jsverse/transloco';
@Component({
  selector: 'app-cart',
  imports: [CommonModule, RouterLink, MovieCardComponent, TranslocoPipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  constructor(
    public readonly cart: CartService,
    public readonly favorites: FavoritesService
  ) {}
}
