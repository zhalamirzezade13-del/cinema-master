import { Injectable, OnDestroy, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';
export type Toast = { id: number; key: string; kind: ToastKind };

@Injectable({ providedIn: 'root' })
export class ToastService implements OnDestroy {
  private readonly state = signal<Toast[]>([]);
  readonly messages = this.state.asReadonly();
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 0;

  show(key: string, kind: ToastKind = 'success'): void {
    if (!key) return;
    const existing = this.state().find(item => item.key === key && item.kind === kind);
    if (existing) this.dismiss(existing.id);
    if (this.state().length >= 3) this.dismiss(this.state()[0].id);
    const id = ++this.nextId;
    this.state.update(items => [...items, { id, key, kind }]);
    this.timers.set(id, setTimeout(() => this.dismiss(id), kind === 'error' ? 10000 : 7000));
  }

  dismiss(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.state.update(items => items.filter(item => item.id !== id));
  }

  pause(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
  }

  resume(id: number): void {
    this.pause(id);
    this.timers.set(id, setTimeout(() => this.dismiss(id), 7000));
  }

  ngOnDestroy(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }
}
