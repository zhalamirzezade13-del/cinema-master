import { auth as firebaseAuth } from './firebase';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  await firebaseAuth.authStateReady();
  return !!firebaseAuth.currentUser || router.createUrlTree(['/login']);
};
