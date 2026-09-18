import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { CartService, CartTicket } from '../../core/cart.service';
import { DemoPaymentService, validDemoCard } from '../../core/demo-payment.service';
import { ToastService } from '../../core/toast.service';
import { auth } from '../../core/firebase';

@Component({
  selector: 'app-payment',
  imports: [CommonModule, FormsModule, RouterLink, TranslocoPipe],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent {
  private readonly cart = inject(CartService);
  private readonly payments = inject(DemoPaymentService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  readonly tickets: CartTicket[] = this.selectedTickets();
  readonly total = this.tickets.reduce((sum, ticket) => sum + ticket.price, 0);
  cardholder = '';
  cardNumber = '';
  expiry = '';
  expiryCalendarOpen = false;
  readonly currentYear = new Date().getFullYear();
  readonly currentMonth = new Date().getMonth() + 1;
  expiryYear = this.currentYear;
  readonly expiryMonths = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
  cvv = '';
  busy = false;
  paid = false;
  error = '';
  receiptIds: string[] = [];

  toggleExpiryCalendar(): void {
    this.expiryCalendarOpen = !this.expiryCalendarOpen;
    if (this.expiryCalendarOpen) {
      const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(this.expiry.trim());
      this.expiryYear = match ? Math.max(this.currentYear, 2000 + Number(match[2])) : this.currentYear;
    }
  }

  selectExpiryMonth(month: string): void {
    this.expiry = `${month} / ${String(this.expiryYear).slice(-2)}`;
    this.expiryCalendarOpen = false;
  }

  private selectedTickets(): CartTicket[] {
    const params = this.route.snapshot.queryParamMap;
    if (!params.has('movie')) return [...this.cart.tickets()];
    const rows = (params.get('row') ?? '').split(',').map(Number);
    const seats = (params.get('seat') ?? '').split(',').map(Number);
    return this.cart.tickets().filter(ticket => ticket.movie === params.get('movie') && ticket.hall === params.get('hall') &&
      rows.some((row, index) => row === ticket.row && seats[index] === ticket.seat));
  }
  pay(): void {
    if (this.busy || this.paid) return;
    this.error = '';
    if (!auth.currentUser) this.error = 'payment.signIn';
    else if (!this.tickets.length || this.tickets.some(ticket => !this.cart.tickets().some(current => current.id === ticket.id))) this.error = 'payment.empty';
    else if (!this.cardholder.trim() || !validDemoCard(this.cardNumber, this.expiry, this.cvv)) this.error = 'payment.invalidCard';
    if (this.error) { this.toast.show(this.error, 'error'); return; }
    this.busy = true;
    try {
      const receipts = this.payments.pay(this.tickets, auth.currentUser!);
      this.receiptIds = receipts.map(item => item.id);
      this.paid = true;
      this.cardholder = this.cardNumber = this.expiry = this.cvv = '';
      this.toast.show('payment.success');
      try { this.cart.completePurchase(this.tickets.map(ticket => ticket.id)); }
      catch { this.toast.show('payment.cartCleanup', 'info'); }
    } catch {
      this.error = 'payment.saveError';
      this.toast.show(this.error, 'error');
    } finally { this.busy = false; }
  }
}
