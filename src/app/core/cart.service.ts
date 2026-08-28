import { Injectable, computed, signal } from '@angular/core';

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
  private readonly storageKey = 'cinema-cart';
  readonly tickets = signal<CartTicket[]>(this.readTickets());
  readonly total = computed(() => this.tickets().reduce((sum, ticket) => sum + ticket.price, 0));

  add(ticket: Omit<CartTicket, 'id'>): void {
    this.update([...this.tickets(), { ...ticket, id: crypto.randomUUID() }]);
  }

  remove(id: string): void {
    this.update(this.tickets().filter(ticket => ticket.id !== id));
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
