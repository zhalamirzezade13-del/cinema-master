import { Routes } from '@angular/router';
import { AdminComponent } from './pages/admin/admin.component';
import { adminGuard } from './core/admin.guard';
import { HomeComponent } from './pages/home/home.component';
import { MoviesComponent } from './pages/movies/movies.component';
import { TheatreComponent } from './pages/theatre/theatre.component';
import { MovieDetailComponent } from './pages/movie-detail/movie-detail.component';
import { PaymentComponent } from './pages/payment/payment.component';
import { LoginComponent } from './pages/login/login.component';
import { CartComponent } from './pages/cart/cart.component';
import { authGuard } from './core/auth.guard';
import { MoviesComponent as AdminMoviesComponent } 
from './pages/admin/movies/movies.component';

import { FavoritesComponent } from './pages/favorites/favorites.component';
import { ManagementComponent } from './pages/admin/management/management.component';
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
}, 

{
  path: 'admin',
  component: AdminComponent,
  canActivate: [adminGuard],
  children: [
    {
      path: 'movies',
      component: AdminMoviesComponent,
      canActivate: [adminGuard]
    },
    {
      path: 'bookings',
      component: ManagementComponent,
      data: { section: 'bookings', demoMode: true },
      canActivate: [adminGuard]
    },
    {
      path: 'comments',
      component: ManagementComponent,
      data: { section: 'comments', demoMode: true },
      canActivate: [adminGuard]
    },
    {
      path: 'halls',
      component: ManagementComponent,
      data: { section: 'halls' },
      canActivate: [adminGuard]
    },
    {
      path: 'sessions',
      component: ManagementComponent,
      data: { section: 'sessions' },
      canActivate: [adminGuard]
    },
    {
      path: 'messages',
      component: ManagementComponent,
      data: { section: 'messages' },
      canActivate: [adminGuard]
    },
    {
      path: 'users',
      component: ManagementComponent,
      data: { section: 'users' },
      canActivate: [adminGuard]
    }
  ]
}
];
