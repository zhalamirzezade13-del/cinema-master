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
  imports: [CommonModule, RouterLink, TranslocoPipe],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent implements OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private subscriptions: (() => void)[] = [];
  private stopAuth: () => void;
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
      this.email = user.email ?? '';
      this.joined = user.metadata.creationTime ?? '';
      this.loading = true;
      this.subscriptions.push(onSnapshot(doc(db, 'users', user.uid), snapshot => {
        this.name = String(snapshot.data()?.['name'] ?? user.displayName ?? '');
        this.cdr.markForCheck();
      }, () => { this.profileError = true; this.cdr.markForCheck(); }));
      this.subscriptions.push(onSnapshot(query(collection(db, 'messages'), where('userId', '==', user.uid)), snapshot => {
        this.messages = snapshot.docs.map(item => ({ ...item.data(), id: item.id } as Message))
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        this.loading = false;
        this.error = false;
        this.cdr.markForCheck();
      }, () => { this.loading = false; this.error = true; this.cdr.markForCheck(); }));
      this.cdr.markForCheck();
    });
  }
  ngOnDestroy(): void { this.stopAuth(); this.subscriptions.forEach(stop => stop()); }
}
