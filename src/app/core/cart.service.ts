import { ToastService } from './toast.service';
import { Injectable, inject, computed, signal } from '@angular/core';

export type CartTicket = {
  id: string;
  movie: string;
  hall: string;
  row: number;
  seat: number;
  price: number;
};

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly toast = inject(ToastService);
  private readonly storageKey = 'cinema-cart';
  readonly tickets = signal<CartTicket[]>(this.readTickets());
  readonly total = computed(() => this.tickets().reduce((sum, ticket) => sum + ticket.price, 0));

  has(ticket: Omit<CartTicket, 'id'>): boolean {
    return this.tickets().some(item =>
      item.movie === ticket.movie &&
      item.hall === ticket.hall &&
      item.row === ticket.row &&
      item.seat === ticket.seat
    );
  }

  add(ticket: Omit<CartTicket, 'id'>): boolean {
    if (this.has(ticket)) { this.toast.show('theatre.duplicateTicket', 'info'); return false; }
    this.update([...this.tickets(), { ...ticket, id: crypto.randomUUID() }]);
    this.toast.show('toast.cartAdded');
    return true;
  }

  remove(id: string): void {
    if (!this.tickets().some(ticket => ticket.id === id)) return;
    this.update(this.tickets().filter(ticket => ticket.id !== id));
    this.toast.show('toast.cartRemoved', 'info');
  }

  completePurchase(ids: string[]): void {
    this.update(this.tickets().filter(ticket => !ids.includes(ticket.id)));
  }

  private update(tickets: CartTicket[]): void {
    this.tickets.set(tickets);
    localStorage.setItem(this.storageKey, JSON.stringify(tickets));
  }

  private readTickets(): CartTicket[] {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) ?? '[]') as CartTicket[];
    } catch {
      return [];
    }
  }
}
