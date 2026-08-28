import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { MoviesComponent } from './pages/movies/movies.component';
import { TheatreComponent } from './pages/theatre/theatre.component';
import { MovieDetailComponent } from './pages/movie-detail/movie-detail.component';
import { PaymentComponent } from './pages/payment/payment.component';
import { LoginComponent } from './pages/login/login.component';
import { CartComponent } from './pages/cart/cart.component';
import { authGuard } from './core/auth.guard';
import { FavoritesComponent } from './pages/favorites/favorites.component';
export const routes: Routes = [{
    path: '',
    component: HomeComponent
  }, {
    path: 'movies',
    component: MoviesComponent
  }, {
    path: 'theatre',
    component: TheatreComponent
  }, {
    path: 'movie',
    component: MovieDetailComponent
  }, {
    path: 'payment',
    component: PaymentComponent
  }, {
    path: 'login',
    component: LoginComponent
  }, {
    path: 'cart',
    component: CartComponent,
    canActivate: [authGuard]
  }, {
    path: 'favorites',
    component: FavoritesComponent,
    canActivate: [authGuard]
}];
