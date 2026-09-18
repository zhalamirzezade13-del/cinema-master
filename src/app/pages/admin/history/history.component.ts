import { DemoPaymentService } from '../../../core/demo-payment.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { AdminDataService, AdminRecord, adminError } from '../admin-data.service';

type ActivityKind = 'users' | 'comments' | 'messages' | 'bookings';
type Activity = { demo?: boolean; id: string; kind: ActivityKind; userId: string; name: string; email: string; detail: string; time: number };
@Component({
  selector: 'app-admin-history',
  imports: [CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit, OnDestroy {
  private readonly payments = inject(DemoPaymentService);
  private readonly data = inject(AdminDataService);
  private readonly cdr = inject(ChangeDetectorRef);
  private destroyed = false;
  readonly kinds: ActivityKind[] = ['users', 'comments', 'messages', 'bookings'];
  activities: Activity[] = [];
  failures: { kind: ActivityKind; message: string }[] = [];
  loading = false;
  search = '';
  kind = 'all';
  get filtered(): Activity[] {
    const term = this.search.trim().toLocaleLowerCase();
    return this.activities.filter(item => (this.kind === 'all' || item.kind === this.kind) &&
      [item.name, item.email, item.userId, item.detail].join(' ').toLocaleLowerCase().includes(term));
  }
  ngOnInit(): void { void this.load(); }
  ngOnDestroy(): void { this.destroyed = true; }
  async load(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.failures = [];
    try {
      const results = await Promise.allSettled(this.kinds.map(kind => this.data.list(kind)));
      if (this.destroyed) return;
      const users = new Map<string, AdminRecord>();
      const profiles = results[0];
      if (profiles.status === 'fulfilled') profiles.value.forEach(user => users.set(user.id, user));
      const activities: Activity[] = [];
      results.forEach((result, index) => {
        const kind = this.kinds[index];
        if (result.status === 'rejected') {
          this.failures.push({ kind, message: adminError(result.reason) });
          return;
        }
        for (const record of result.value) {
          if (kind === 'users' && record['role'] === 'admin') continue;
          const userId = String(kind === 'users' ? record.id : record['userId'] ?? '');
          const user = users.get(userId);
          activities.push({
            id: `${kind}/${record.id}`, kind, userId,
            name: String(user?.['name'] ?? record['authorName'] ?? record['customerName'] ?? record['name'] ?? ''),
            email: String(user?.['email'] ?? record['email'] ?? ''),
            detail: [record['movieTitle'] ?? record['movie'], record['subject'], record['text'] ?? record['message']].filter(Boolean).join(' · '),
            time: this.timestamp(record['createdAt'])
          });
        }
      });
      try {
        for (const booking of this.payments.list()) activities.push({
          id: booking.id, kind: 'bookings', demo: true, userId: booking.userId,
          name: booking.customerName, email: booking.email,
          detail: `${booking.movie} · ${booking.hall} · ${booking.price} ₼ · •••• ${booking.cardLast4}`,
          time: this.timestamp(booking.createdAt)
        });
      } catch { this.failures.push({ kind: 'bookings', message: 'payment.readError' }); }
      this.activities = activities.sort((a, b) => b.time - a.time || a.id.localeCompare(b.id));
    } finally {
      this.loading = false;
      if (!this.destroyed) this.cdr.markForCheck();
    }
  }
  private timestamp(value: unknown): number {
    if (typeof value === 'string') return Date.parse(value) || 0;
    if (value && typeof value === 'object' && 'seconds' in value && typeof value.seconds === 'number') return value.seconds * 1000;
    return 0;
  }
}
