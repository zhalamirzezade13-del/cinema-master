import { Injectable } from '@angular/core';
import { CartTicket } from './cart.service';

export type DemoBooking = CartTicket & {
  userId: string; customerName: string; email: string; cardLast4: string;
  createdAt: string; status: 'paid'; paymentStatus: 'paid'; demo: true;
};

export function validDemoCard(number: string, expiry: string, cvv: string, now = new Date()): boolean {
  if (number.replace(/\s/g, '') !== '4242424242424242' || !/^\d{3}$/.test(cvv)) return false;
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(expiry.trim());
  if (!match) return false;
  const month = Number(match[1]), year = 2000 + Number(match[2]);
  return month >= 1 && month <= 12 && new Date(year, month, 1) > now;
}

@Injectable({ providedIn: 'root' })
export class DemoPaymentService {
  private readonly key = 'cinema-demo-bookings-v1';
  list(): DemoBooking[] {
    const value: unknown = JSON.parse(localStorage.getItem(this.key) ?? '[]');
    if (!Array.isArray(value) || value.some(item => !item || item.demo !== true || typeof item.id !== 'string')) {
      throw new Error('Invalid demo booking storage');
    }
    return value;
  }
  pay(tickets: CartTicket[], user: { uid: string; displayName: string | null; email: string | null }): DemoBooking[] {
    if (!user.uid || !tickets.length || tickets.some(ticket => !ticket.id || !ticket.movie || !ticket.hall ||
      !Number.isInteger(ticket.row) || ticket.row < 1 || !Number.isInteger(ticket.seat) || ticket.seat < 1 ||
      !Number.isFinite(ticket.price) || ticket.price <= 0)) throw new Error('Invalid checkout');
    const previous = this.list();
    const records = tickets.map(ticket => {
      const id = `demo-${user.uid}-${ticket.id}`;
      return previous.find(item => item.id === id) ?? {
        id, movie: ticket.movie, hall: ticket.hall, row: ticket.row, seat: ticket.seat, price: ticket.price,
        userId: user.uid, customerName: user.displayName ?? '', email: user.email ?? '',
        cardLast4: '4242', createdAt: new Date().toISOString(), status: 'paid' as const,
        paymentStatus: 'paid' as const, demo: true as const
      };
    });
    const unique = new Map([...previous, ...records].map(item => [item.id, item]));
    localStorage.setItem(this.key, JSON.stringify([...unique.values()]));
    return records;
  }
}
