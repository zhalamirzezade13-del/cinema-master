import { Injectable, signal } from '@angular/core';

import {
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
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