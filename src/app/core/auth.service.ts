import { Injectable, signal } from '@angular/core';

import {
  EmailAuthProvider,
  FacebookAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  updatePassword,
  verifyBeforeUpdateEmail,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

import {
  auth,
  db
} from './firebase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  readonly isLoggedIn = signal(false);
  readonly isAdmin = signal(false);

  constructor() {
    onAuthStateChanged(auth, async user => {
      if (!user) {
        this.isLoggedIn.set(false);
        this.isAdmin.set(false);
        return;
      }

      this.isLoggedIn.set(true);

      await this.loadUserRole(user.uid);
    });
  }

  async login(
    email: string,
    password: string
  ): Promise<boolean> {

    try {
      await setPersistence(
        auth,
        browserSessionPersistence
      );

      const credential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      this.isLoggedIn.set(true);

      await this.loadUserRole(
        credential.user.uid
      );

      console.log(
        'LOGIN COMPLETE - IS ADMIN:',
        this.isAdmin()
      );

      return true;

    } catch (error) {
      console.error(
        'Firebase login error:',
        error
      );

      this.isLoggedIn.set(false);
      this.isAdmin.set(false);

      return false;
    }
  }

  async loginWithProvider(provider: 'google' | 'facebook'): Promise<void> {
    await setPersistence(auth, browserSessionPersistence);
    const authProvider = provider === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
    if (provider === 'google') {
      authProvider.setCustomParameters({ prompt: 'select_account' });
    }
    const credential = await signInWithPopup(
      auth,
      authProvider
    );

    this.isLoggedIn.set(true);
    await this.loadUserRole(credential.user.uid);

    // New social accounts need the same user document as email registrations.
    // A failed profile write must not turn a successful Firebase sign-in into an error.
    if (credential.user.email) {
      try {
        const userRef = doc(db, 'users', credential.user.uid);
        if (!(await getDoc(userRef)).exists()) {
          await setDoc(userRef, {
            name: (credential.user.displayName?.trim() || credential.user.email).slice(0, 100),
            email: credential.user.email,
            role: 'user',
            createdAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.warn('Could not save social sign-in profile:', error);
      }
    }
  }

  async register(name: string, email: string, password: string): Promise<boolean> {
    await setPersistence(auth, browserSessionPersistence);
    const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
    this.isAdmin.set(false);
    this.isLoggedIn.set(true);
    // Account creation has succeeded even if the optional profile write fails.
    try {
      await updateProfile(user, { displayName: name.trim() });
      await setDoc(doc(db, 'users', user.uid), {
        name: name.trim(), email: user.email, role: 'user', createdAt: serverTimestamp()
      });
      return true;
    } catch {
      return false;
    }
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  }

  async changeUsername(name: string): Promise<void> {
    const user = auth.currentUser;
    const normalizedName = name.trim();
    if (!user || !normalizedName || normalizedName.length > 100) throw new Error('Invalid username');

    await updateProfile(user, { displayName: normalizedName });

    // Authentication owns the display name. Keep the Firestore profile in sync
    // when available, but do not report a failed rename after Auth has succeeded.
    try {
      const userRef = doc(db, 'users', user.uid);
      const profile = await getDoc(userRef);

      if (profile.exists()) {
        await setDoc(userRef, { name: normalizedName }, { merge: true });
      } else {
        await setDoc(userRef, {
          name: normalizedName,
          email: user.email ?? '',
          role: 'user',
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.warn('Could not synchronize the username to Firestore:', error);
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user?.email) throw new Error('Sign in required');
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
    await updatePassword(user, newPassword);
  }

  async changeEmail(currentPassword: string, newEmail: string): Promise<void> {
    const user = auth.currentUser;
    const normalizedEmail = newEmail.trim();
    if (!user?.email) throw new Error('Sign in required');
    if (!normalizedEmail) throw new Error('Invalid email');
    if (normalizedEmail.toLowerCase() === user.email.toLowerCase()) {
      throw { code: 'auth/same-email' };
    }
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
    await verifyBeforeUpdateEmail(user, normalizedEmail);
  }

  async logout(): Promise<void> {
    await signOut(auth);

    this.isLoggedIn.set(false);
    this.isAdmin.set(false);
  }

  private async loadUserRole(
    uid: string
  ): Promise<void> {

    try {
      console.log('AUTH UID:', uid);

      const userRef = doc(
        db,
        'users',
        uid
      );

      const userSnapshot =
        await getDoc(userRef);

      console.log(
        'USER EXISTS:',
        userSnapshot.exists()
      );

      if (!userSnapshot.exists()) {
        console.log(
          'USER DOCUMENT NOT FOUND'
        );

        this.isAdmin.set(false);
        return;
      }

      const data =
        userSnapshot.data();

      console.log(
        'USER DATA:',
        data
      );

      console.log(
        'ROLE:',
        data['role']
      );

      const admin =
        data['role'] === 'admin';

      this.isAdmin.set(admin);

      console.log(
        'IS ADMIN:',
        this.isAdmin()
      );

    } catch (error) {
      console.error(
        'User role error:',
        error
      );

      this.isAdmin.set(false);
    }
  }
}
