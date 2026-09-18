import { DemoPaymentService } from '../../../core/demo-payment.service';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminDataService, AdminRecord, adminError } from '../admin-data.service';
import { DemoSection, demoRecords } from '../admin-demo-data';

type Section = 'halls' | 'sessions' | 'messages' | 'users' | 'bookings' | 'comments';
type Field = { key: string; label: string; type: string; min?: number; options?: { id: string; name: string }[] };

@Component({
  selector: 'app-admin-management',
  imports: [CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './management.component.html',
  styleUrl: '../admin-ui.css'
})
export class ManagementComponent {
  private readonly i18n = inject(TranslocoService);
  private readonly payments = inject(DemoPaymentService);
  private readonly data = inject(AdminDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild('editor', { static: true }) editor!: ElementRef<HTMLDialogElement>;
  @ViewChild('detailsDialog', { static: true }) detailsDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('deleteDialog', { static: true }) deleteDialog!: ElementRef<HTMLDialogElement>;
  selected: AdminRecord | null = null;
  pendingDelete: AdminRecord | null = null;
  deleteError = '';
  replyText = '';
  replyError = '';
  replyNotice = '';
  private get demoReplyKey(): string {
    return this.section === 'messages' ? 'cinema-admin-demo-message-replies' : 'cinema-admin-demo-replies';
  }
  get canReply(): boolean { return this.section === 'comments' || this.section === 'messages'; }
  demoMode = true;
  filter = 'all';
  section: Section = 'halls';
  records: AdminRecord[] = [];
  halls: AdminRecord[] = [];
  movies: AdminRecord[] = [];
  search = '';
  loading = false;
  saving = false;
  error = '';
  notice = '';
  editingId: string | null = null;
  form: Record<string, string | number> = {};
  fields: Field[] = [];
  private request = 0;
  readonly titles: Record<Section, string> = { halls: 'admin.halls', sessions: 'admin.sessions', messages: 'admin.messages', users: 'admin.users', bookings: 'admin.bookings', comments: 'admin.comments' };
  readonly descriptions: Record<Section, string> = {
    halls: 'admin.hallsDescription', sessions: 'admin.sessionsDescription',
    messages: 'admin.messagesDescription', users: 'admin.usersDescription', bookings: 'admin.bookingsDescription', comments: 'admin.commentsDescription'
  };
  constructor() {
    this.route.data.pipe(takeUntilDestroyed()).subscribe(data => {
      this.section = data['section'] as Section;
      this.demoMode = data['demoMode'] ?? !['comments', 'messages', 'users'].includes(this.section);
      this.updateFields();
      this.search = '';
      this.filter = 'all';
      this.selected = null;
      this.notice = '';
      void this.load();
    });
    this.destroyRef.onDestroy(() => this.request++);
  }
  get supportsDemo(): boolean { return ['users', 'bookings', 'comments', 'messages'].includes(this.section); }
  toggleDemo(): void {
    this.demoMode = !this.demoMode;
    this.clearFilters();
    this.selected = null;
    void this.load();
  }
  get editable(): boolean { return this.section === 'halls' || this.section === 'sessions'; }
  // Keep form descriptors stable: recreating NgModel controls schedules another
  // change-detection pass and can otherwise keep the browser in a microtask loop.
  private updateFields(): void {
    if (this.section === 'halls') {
      this.fields = [
      { key: 'name', label: 'admin.hallName', type: 'text' },
      { key: 'type', label: 'admin.hallType', type: 'text' },
      { key: 'capacity', label: 'admin.capacity', type: 'number', min: 1 }
      ];
      return;
    }
    if (this.section !== 'sessions') {
      this.fields = [];
      return;
    }
    this.fields = [
      { key: 'movieId', label: 'admin.movie', type: 'select', options: this.movies.map(m => ({ id: m.id, name: String(m['title'] ?? m.id) })) },
      { key: 'hallId', label: 'admin.hall', type: 'select', options: this.halls.map(h => ({ id: h.id, name: String(h['name'] ?? h.id) })) },
      { key: 'startsAt', label: 'admin.startsAt', type: 'datetime-local' },
      { key: 'price', label: 'admin.price', type: 'number', min: 0 }
    ];
  }
  trackField(_index: number, field: Field): string { return field.key; }
  trackOption(_index: number, option: { id: string }): string { return option.id; }

  readonly filterOptions: Record<Section, string[]> = {
    halls: [], sessions: ['future', 'past'], messages: ['unread', 'read'],
    users: ['admin', 'user'], bookings: ['pending', 'confirmed', 'cancelled', 'paid'],
    comments: ['pending', 'approved', 'hidden']
  };
  private t(key: string): string { return this.i18n.translate('admin.' + key); }
  statusLabel(value: unknown): string {
    const status = String(value ?? 'unknown');
    const keys: Record<string, string> = { admin: 'administrator', user: 'user', read: 'read', unread: 'unread',
      pending: 'pending', confirmed: 'confirmed', cancelled: 'cancelled', paid: 'paid', approved: 'approved', hidden: 'hidden',
      future: 'future', past: 'past', unknown: 'unknown' };
    return keys[status] ? this.t(keys[status]) : status;
  }
  private status(record: AdminRecord): string {
    if (this.section === 'messages') return record['read'] === true ? 'read' : 'unread';
    if (this.section === 'users') return String(record['role'] ?? 'user');
    if (this.section === 'sessions') {
      const time = this.dateValue(record['startsAt']);
      return time === null ? 'unknown' : time >= Date.now() ? 'future' : 'past';
    }
    return String(record['status'] ?? 'unknown');
  }
  recordStatus(record: AdminRecord): string { return this.statusLabel(this.status(record)); }
  get filtered(): AdminRecord[] {
    const query = this.search.trim().toLocaleLowerCase();
    return this.records.filter(record =>
      (this.filter === 'all' || this.status(record) === this.filter) &&
      [this.title(record), this.detail(record), record['email'] ?? '', record['authorName'] ?? record['name'] ?? '', record.id]
        .join(' ').toLocaleLowerCase().includes(query));
  }
  get summary(): { label: string; value: number } {
    const count = (predicate: (record: AdminRecord) => boolean) => this.records.filter(predicate).length;
    switch (this.section) {
      case 'halls': return { label: 'admin.totalCapacity', value: this.records.reduce((sum, r) => sum + this.numeric(r['capacity']), 0) };
      case 'sessions': return { label: 'admin.upcomingSessions', value: count(r => this.status(r) === 'future') };
      case 'messages': return { label: 'admin.unreadMessages', value: count(r => r['read'] !== true) };
      case 'users': return { label: 'admin.adminUsers', value: count(r => r['role'] === 'admin') };
      case 'bookings': return { label: 'admin.totalBookings', value: this.records.reduce((sum, r) => sum + this.numeric(r['total'] ?? r['price']), 0) };
      case 'comments': return { label: 'admin.ratedComments', value: count(r => typeof r['rating'] === 'number' && Number.isFinite(r['rating'])) };
    }
  }
  private numeric(value: unknown): number { const number = Number(value); return Number.isFinite(number) ? number : 0; }
  title(record: AdminRecord): string {
    if (this.section === 'sessions' || this.section === 'bookings' || this.section === 'comments') {
      return String(this.movies.find(m => m.id === record['movieId'])?.['title'] ?? record['movieTitle'] ?? record['movie'] ?? this.t('movie'));
    }
    if (this.section === 'messages') return String(record['subject'] ?? record['name'] ?? record['email'] ?? this.t('message'));
    return String(record['name'] ?? record['displayName'] ?? record['email'] ?? record.id);
  }
  private hallName(record: AdminRecord): string {
    return String(this.halls.find(h => h.id === record['hallId'])?.['name'] ?? record['hallName'] ?? record['hall'] ?? record['hallId'] ?? this.t('unknown'));
  }
  detail(record: AdminRecord): string {
    switch (this.section) {
      case 'halls': return `${record['type'] ?? this.t('hall')} · ${record['capacity'] ?? '—'} ${this.t('seats')}`;
      case 'sessions': return `${this.hallName(record)} · ${this.formatDate(record['startsAt'])} · ${record['price'] ?? '—'} AZN`;
      case 'users': return `${record['email'] ?? this.t('emailMissing')} · ${this.statusLabel(record['role'] ?? 'user')}`;
      case 'messages': return String(record['message'] ?? record['text'] ?? record['body'] ?? this.t('textMissing'));
      case 'bookings': return `${record['customerName'] ?? record['email'] ?? record['userId'] ?? this.t('customer')} · ${this.hallName(record)} · ${record['total'] ?? record['price'] ?? '—'} AZN`;
      case 'comments': return String(record['text'] ?? record['comment'] ?? record['body'] ?? this.t('textMissing'));
    }
  }
  private dateValue(value: unknown): number | null {
    let date: number;
    if (value instanceof Date) date = value.getTime();
    else if (typeof value === 'object' && value !== null && 'seconds' in value) date = Number(value.seconds) * 1000;
    else if (typeof value === 'string' || typeof value === 'number') date = new Date(value).getTime();
    else return null;
    return Number.isFinite(date) ? date : null;
  }
  formatDate(value: unknown): string {
    const date = this.dateValue(value);
    return date === null ? this.t('unknown') : new Intl.DateTimeFormat(this.i18n.getActiveLang() === 'az' ? 'az-AZ' : 'en-GB',
      { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Baku' }).format(date);
  }
  showDetails(record: AdminRecord): void {
    this.selected = record;
    this.replyText = String(record['adminReply'] ?? '');
    this.replyError = '';
    this.replyNotice = '';
    this.detailsDialog.nativeElement.showModal();
  }
  get detailRows(): { label: string; value: string }[] {
    const r = this.selected;
    if (!r) return [];
    const fields: Record<Section, [string, unknown][]> = {
      halls: [['name', r['name']], ['hallType', r['type']], ['capacity', r['capacity']]],
      sessions: [['movie', this.title(r)], ['hall', this.hallName(r)], ['startsAt', this.formatDate(r['startsAt'])], ['price', r['price']]],
      messages: [['movie', r['movieTitle']], ['subject', r['subject']], ['sender', r['name'] ?? r['senderName']], ['email', r['email']], ['message', r['message'] ?? r['text'] ?? r['body']], ['status', this.recordStatus(r)]],
      users: [['name', r['name'] ?? r['displayName']], ['email', r['email']], ['phone', r['phone'] ?? r['phoneNumber']], ['role', this.recordStatus(r)]],
      bookings: [['movie', this.title(r)], ['customer', r['customerName'] ?? r['userId']], ['email', r['email']], ['hall', this.hallName(r)], ['startsAt', this.formatDate(r['startsAt'] ?? r['date'])], ['row', r['row']], ['seat', r['seats'] ?? r['seat']], ['amount', r['total'] ?? r['price']], ['status', this.recordStatus(r)], ['paymentStatus', this.statusLabel(r['paymentStatus'])]],
      comments: [['movie', this.title(r)], ['author', r['authorName'] ?? r['name'] ?? r['userId']], ['rating', r['rating']], ['comment', r['text'] ?? r['comment'] ?? r['body']], ['status', this.recordStatus(r)]]
    };
    return [...fields[this.section], ['createdAt', this.formatDate(r['createdAt'])], ['id', r.id]].map(([label, value]) =>
      ({ label: 'admin.' + label, value: value === undefined || value === null || value === '' ? this.t('unknown') : Array.isArray(value) ? value.map(String).join(', ') : String(value) }));
  }
  clearFilters(): void { this.search = ''; this.filter = 'all'; }
  async switchSection(section: 'halls' | 'sessions'): Promise<void> {
    if (this.section === section) return;
    this.section = section;
    this.filter = 'all';
    this.selected = null;
    this.updateFields();
    this.search = '';
    this.notice = '';
    await this.load();
  }
  async load(): Promise<void> {
    const request = ++this.request;
    const section = this.section;
    this.loading = true;
    this.error = '';
    this.records = [];
    try {
      if (this.supportsDemo && this.demoMode) {
        this.records = demoRecords(this.section as DemoSection);
        if (section === 'bookings') this.records = [...this.payments.list(), ...this.records];
        if (this.canReply) {
          try {
            const replies = JSON.parse(localStorage.getItem(this.demoReplyKey) ?? '{}');
            this.records = this.records.map(record => {
              const reply = replies?.[record.id];
              return typeof reply?.adminReply === 'string'
                ? { ...record, adminReply: reply.adminReply, repliedAt: reply.repliedAt } : record;
            });
          } catch { /* Demo records remain available when storage is unavailable. */ }
        }
        this.halls = [];
        this.movies = [];
        return;
      }
      const [records, halls, movies] = await Promise.all([
        this.data.list(section),
        section === 'sessions' ? this.data.list('halls') : Promise.resolve([]),
        section === 'sessions' ? this.data.list('movies') : Promise.resolve([])
      ]);
      if (request !== this.request) return;
      this.records = records;
      this.halls = halls;
      this.movies = movies;
      this.updateFields();
    } catch (error) {
      if (request === this.request) this.error = adminError(error);
    } finally {
      if (request === this.request) { this.loading = false; this.cdr.markForCheck(); }
    }
  }
  open(record?: AdminRecord): void {
    this.error = '';
    this.notice = '';
    this.editingId = record?.id ?? null;
    this.form = {};
    this.fields.forEach(field => this.form[field.key] = (record?.[field.key] ?? '') as string | number);
    this.editor.nativeElement.showModal();
  }
  async save(): Promise<void> {
    if (this.saving || !this.editable) return;
    this.error = '';
    const payload: Record<string, unknown> = {};
    for (const field of this.fields) {
      const raw = this.form[field.key];
      const value = field.type === 'number' ? Number(raw) : String(raw ?? '').trim();
      if (raw === '' || raw == null || value === '' || (field.type === 'number' && (!Number.isFinite(value) || Number(value) < (field.min ?? 0)))) {
        this.error = 'admin.requiredFields';
        return;
      }
      payload[field.key] = value;
    }
    if (this.section === 'halls' && !Number.isInteger(payload['capacity'])) {
      this.error = 'admin.capacityValidation';
      return;
    }
    if (this.section === 'sessions' && (!this.halls.some(h => h.id === payload['hallId']) || !this.movies.some(m => m.id === payload['movieId']) || !Number.isFinite(Date.parse(String(payload['startsAt']))))) {
      this.error = 'admin.sessionValidation';
      return;
    }
    this.saving = true;
    try {
      const id = await this.data.save(this.section, this.editingId, payload);
      const record = { ...payload, id };
      this.records = this.editingId ? this.records.map(r => r.id === id ? record : r) : [...this.records, record];
      this.notice = 'admin.recordSaved';
      this.editor.nativeElement.close();
    } catch (error) { this.error = adminError(error); }
    finally { this.saving = false; this.cdr.markForCheck(); }
  }
  async saveReply(): Promise<void> {
    if (this.saving || !this.canReply || !this.selected) return;
    const text = this.replyText.trim();
    this.replyError = '';
    this.replyNotice = '';
    if (!text || text.length > 2000) {
      this.replyError = 'admin.replyValidation';
      return;
    }
    const id = this.selected.id;
    const request = this.request;
    const payload = { adminReply: text, repliedAt: new Date().toISOString() };
    this.saving = true;
    try {
      if (this.demoMode) {
        let replies: Record<string, unknown> = {};
        try {
          const stored = JSON.parse(localStorage.getItem(this.demoReplyKey) ?? '{}');
          if (stored && typeof stored === 'object' && !Array.isArray(stored)) replies = stored;
        } catch { /* Replace malformed demo storage on save. */ }
        localStorage.setItem(this.demoReplyKey, JSON.stringify({ ...replies, [id]: payload }));
      } else {
        await this.data.save(this.section, id, payload);
      }
      if (request === this.request) {
        this.records = this.records.map(record => record.id === id ? { ...record, ...payload } : record);
        if (this.selected?.id === id) {
          this.selected = { ...this.selected, ...payload };
          this.replyText = text;
          this.replyNotice = 'admin.replySaved';
        }
      }
    } catch (error) {
      if (request === this.request) this.replyError = this.demoMode ? 'admin.replyStorageError' : adminError(error);
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }
  async toggleRead(record: AdminRecord): Promise<void> {
    if (this.saving) return;
    this.saving = true;
    this.error = '';
    const request = this.request;
    try {
      const read = record['read'] !== true;
      if (!(this.supportsDemo && this.demoMode)) {
        await this.data.save('messages', record.id, { read });
      }
      if (request === this.request) {
        this.records = this.records.map(r => r.id === record.id ? { ...r, read } : r);
        if (this.selected?.id === record.id) this.selected = { ...this.selected, read };
        this.notice = 'admin.messageUpdated';
      }
    } catch (error) { if (request === this.request) this.error = adminError(error); }
    finally { this.saving = false; this.cdr.markForCheck(); }
  }

  askDeleteComment(record: AdminRecord): void {
    if (this.section !== 'comments' || this.demoMode || this.saving) return;
    this.pendingDelete = record;
    this.deleteError = '';
    this.deleteDialog.nativeElement.showModal();
  }

  async deleteComment(): Promise<void> {
    if (this.section !== 'comments' || this.demoMode || this.saving || !this.pendingDelete) return;
    const id = this.pendingDelete.id;
    const request = this.request;
    this.saving = true;
    this.deleteError = '';
    try {
      await this.data.remove('comments', id);
      if (request === this.request) {
        this.records = this.records.filter(record => record.id !== id);
        if (this.selected?.id === id) {
          this.selected = null;
          this.detailsDialog.nativeElement.close();
        }
        this.pendingDelete = null;
        this.deleteDialog.nativeElement.close();
        this.notice = 'admin.commentDeleted';
      }
    } catch (error) {
      if (request === this.request) this.deleteError = adminError(error);
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }
}
