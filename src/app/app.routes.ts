import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
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
}, 

{
  path: 'admin',
  loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
  canActivate: [adminGuard],
  children: [
    {
      path: 'movies',
      loadComponent: () => import('./pages/admin/movies/movies.component').then(m => m.MoviesComponent),
      canActivate: [adminGuard]
    },
    {
      path: 'bookings',
      loadComponent: () => import('./pages/admin/management/management.component').then(m => m.ManagementComponent),
      data: { section: 'bookings', demoMode: true },
      canActivate: [adminGuard]
    },
    {
      path: 'comments',
      loadComponent: () => import('./pages/admin/management/management.component').then(m => m.ManagementComponent),
      data: { section: 'comments', demoMode: true },
      canActivate: [adminGuard]
    },
    {
      path: 'halls',
      loadComponent: () => import('./pages/admin/management/management.component').then(m => m.ManagementComponent),
      data: { section: 'halls' },
      canActivate: [adminGuard]
    },
    {
      path: 'sessions',
      loadComponent: () => import('./pages/admin/management/management.component').then(m => m.ManagementComponent),
      data: { section: 'sessions' },
      canActivate: [adminGuard]
    },
    {
      path: 'messages',
      loadComponent: () => import('./pages/admin/management/management.component').then(m => m.ManagementComponent),
      data: { section: 'messages' },
      canActivate: [adminGuard]
    },
    {
      path: 'users',
      loadComponent: () => import('./pages/admin/management/management.component').then(m => m.ManagementComponent),
      data: { section: 'users' },
      canActivate: [adminGuard]
    }
  ]
}
];
