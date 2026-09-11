import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { onAuthStateChanged } from 'firebase/auth';

import { AuthService } from './auth.service';
import { auth } from './firebase';

export const adminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = await new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      unsubscribe();
      resolve(currentUser);
    });
  });

  if (!user) {
    return router.createUrlTree(['/login']);
  }


  for (let i = 0; i < 20; i++) {
    if (authService.isAdmin()) {
      return true;
    }

    await new Promise(resolve =>
      setTimeout(resolve, 50)
    );
  }

  return router.createUrlTree(['/movies']);
};