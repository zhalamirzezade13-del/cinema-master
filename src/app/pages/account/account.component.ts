import { ToastService } from '../../core/toast.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../core/firebase';

type Message = { id: string; subject: string; message: string; movieTitle?: string; adminReply?: string; createdAt?: { seconds: number } };
@Component({
  selector: 'app-account',
  imports: [CommonModule, FormsModule, RouterLink, TranslocoPipe],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent implements OnDestroy {
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private subscriptions: (() => void)[] = [];
  private stopAuth: () => void;
  private readonly authService = inject(AuthService);
  username = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  nameBusy = false;
  passwordBusy = false;
  nameStatus = '';
  passwordStatus = '';
  newEmail = '';
  emailPassword = '';
  emailBusy = false;
  emailStatus = '';
  async saveEmail(): Promise<void> {
    if (this.emailBusy) return;
    this.emailBusy = true;
    this.emailStatus = '';
    try {
      await this.authService.changeEmail(this.emailPassword, this.newEmail);
      this.newEmail = this.newEmail.trim();
      this.emailStatus = 'settings.emailSent';
    } catch (error) {
      const code = (error as { code?: string })?.code;
      const errors: Record<string, string> = {
        'auth/same-email': 'emailSame',
        'auth/invalid-email': 'emailInvalid',
        'auth/email-already-in-use': 'emailUsed',
        'auth/wrong-password': 'emailPasswordError',
        'auth/invalid-credential': 'emailPasswordError',
        'auth/too-many-requests': 'emailTooManyRequests'
      };
      this.emailStatus = 'settings.' + (errors[code ?? ''] ?? 'emailError');
    } finally {
      this.toast.show(this.emailStatus, this.emailStatus === 'settings.emailSent' ? 'success' : 'error');
      this.emailPassword = '';
      this.emailBusy = false;
      this.cdr.markForCheck();
    }
  }
  async saveUsername(): Promise<void> {
    if (this.nameBusy) return;
    this.nameBusy = true;
    this.nameStatus = '';
    try {
      await this.authService.changeUsername(this.username);
      this.username = this.username.trim();
      this.name = this.username;
      this.nameStatus = 'settings.saved';
    }
    catch { this.nameStatus = 'settings.saveError'; }
    finally { this.toast.show(this.nameStatus, this.nameStatus === 'settings.saved' ? 'success' : 'error'); this.nameBusy = false; this.cdr.markForCheck(); }
  }
  async savePassword(): Promise<void> {
    if (this.passwordBusy) return;
    if (this.newPassword !== this.confirmPassword) { this.passwordStatus = 'settings.mismatch'; this.toast.show(this.passwordStatus, 'error'); return; }
    this.passwordBusy = true;
    this.passwordStatus = '';
    try {
      await this.authService.changePassword(this.currentPassword, this.newPassword);
      this.currentPassword = this.newPassword = this.confirmPassword = '';
      this.passwordStatus = 'settings.saved';
    } catch { this.passwordStatus = 'settings.passwordError'; }
    finally { this.toast.show(this.passwordStatus, this.passwordStatus === 'settings.saved' ? 'success' : 'error'); this.passwordBusy = false; this.cdr.markForCheck(); }
  }
  name = '';
  email = '';
  joined = '';
  messages: Message[] = [];
  loading = true;
  error = false;
  profileError = false;
  constructor() {
    this.stopAuth = onAuthStateChanged(auth, user => {
      this.subscriptions.forEach(stop => stop());
      this.subscriptions = [];
      this.messages = [];
      this.name = '';
      this.email = '';
      this.joined = '';
      this.error = false;
      this.profileError = false;
      if (!user) { void this.router.navigate(['/login']); return; }
      this.name = user.displayName ?? '';
      this.username = this.name;
      this.email = user.email ?? '';
      this.joined = user.metadata.creationTime ?? '';
      this.loading = true;
      this.subscriptions.push(onSnapshot(doc(db, 'users', user.uid), snapshot => {
        // Firebase Auth is the canonical username source. Firestore may still
        // contain the previous value when its synchronization is delayed or denied.
        this.name = String(user.displayName ?? snapshot.data()?.['name'] ?? '');
        if (!this.nameBusy) this.username = this.name;
        this.cdr.markForCheck();
      }, error => {
        console.error('Account profile listener failed:', error.code, error.message);
        this.profileError = true;
        this.cdr.markForCheck();
      }));
      this.subscriptions.push(onSnapshot(query(collection(db, 'messages'), where('userId', '==', user.uid)), snapshot => {
        this.messages = snapshot.docs.map(item => ({ ...item.data(), id: item.id } as Message))
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        this.loading = false;
        this.error = false;
        this.cdr.markForCheck();
      }, error => {
        console.error('Account messages listener failed:', error.code, error.message);
        this.loading = false;
        this.error = true;
        this.cdr.markForCheck();
      }));
      this.cdr.markForCheck();
    });
  }
  ngOnDestroy(): void { this.stopAuth(); this.subscriptions.forEach(stop => stop()); }
}
