import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { auth, db } from '../../../core/firebase';
import { AuthService } from '../../../core/auth.service';

type Comment = { id: string; authorName: string; text: string; rating: number; adminReply?: string; createdAt?: { seconds: number } };

@Component({
  selector: 'app-movie-feedback',
  imports: [CommonModule, FormsModule, RouterLink, TranslocoPipe],
  templateUrl: './movie-feedback.component.html',
  styleUrl: './movie-feedback.component.css'
})
export class MovieFeedbackComponent implements OnChanges, OnDestroy {
  @Input() movieId = '';
  @Input() movieTitle = '';
  readonly account = inject(AuthService);
  readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private unsubscribe?: () => void;
  private generation = 0;
  comments: Comment[] = [];
  mode: 'comment' | 'message' = 'comment';
  name = '';
  text = '';
  subject = '';
  rating = 8;
  saving = false;
  loading = false;
  error = '';
  listError = false;
  notice = '';
  get movieKey(): string { return this.movieId || `title:${this.movieTitle}`; }

  ngOnChanges(): void {
    this.generation++;
    this.text = '';
    this.subject = '';
    this.error = '';
    this.notice = '';
    this.loadComments();
  }
  loadComments(): void {
    this.unsubscribe?.();
    this.comments = [];
    this.loading = true;
    this.listError = false;
    const generation = this.generation;
    this.unsubscribe = onSnapshot(query(collection(db, 'comments'),
      where('movieKey', '==', this.movieKey), where('status', '==', 'approved')), snapshot => {
      if (generation !== this.generation) return;
      this.comments = snapshot.docs.map(item => ({ ...item.data(), id: item.id } as Comment))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      this.loading = false;
      this.cdr.markForCheck();
    }, () => {
      if (generation !== this.generation) return;
      this.loading = false;
      this.listError = true;
      this.cdr.markForCheck();
    });
  }
  setMode(mode: 'comment' | 'message'): void {
    if (this.saving) return;
    this.mode = mode;
    this.error = '';
    this.notice = '';
  }
  async submit(): Promise<void> {
    if (this.saving) return;
    const user = auth.currentUser;
    this.error = '';
    this.notice = '';
    if (!user) { this.error = 'feedback.loginRequired'; return; }
    const name = this.name.trim() || user.displayName || '';
    const text = this.text.trim();
    const subject = this.subject.trim();
    if (!name || name.length > 100 || !text || text.length > 2000 ||
        (this.mode === 'message' && (!subject || subject.length > 150)) ||
        (this.mode === 'comment' && (!Number.isInteger(this.rating) || this.rating < 1 || this.rating > 10))) {
      this.error = 'feedback.validation'; return;
    }
    const mode = this.mode;
    const generation = this.generation;
    const common = { userId: user.uid, movieKey: this.movieKey, movieTitle: this.movieTitle, createdAt: serverTimestamp() };
    this.saving = true;
    try {
      await addDoc(collection(db, mode === 'comment' ? 'comments' : 'messages'), mode === 'comment'
        ? { ...common, authorName: name, text, rating: this.rating, status: 'approved' }
        : { ...common, name, email: user.email ?? '', subject, message: text, read: false });
      if (generation === this.generation) {
        this.text = '';
        this.subject = '';
        this.notice = mode === 'comment' ? 'feedback.commentSent' : 'feedback.messageSent';
      }
    } catch {
      if (generation === this.generation) this.error = 'feedback.sendError';
    } finally { this.saving = false; this.cdr.markForCheck(); }
  }
  ngOnDestroy(): void { this.generation++; this.unsubscribe?.(); }
}
