import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';
import { TranslocoPipe } from '@jsverse/transloco';
import { VipTheatreViewComponent } from './vip-theatre-view.component';
type Seat = {
  row: number;
  number: number;
  price: number;
  status: 'available' | 'occupied';
};

type Hall = {
  id: number;
  name: string;
  type: string;
  detail: string;
  layout: 'premium' | 'standard' | 'vip' | 'family';
  rows: number[];
  blocks: number[][];
};

function seatBlocks(sizes: number[]): number[][] {
  let first = 1;
  return sizes.map(size => {
    const block = Array.from({ length: size }, (_, index) => first + index);
    first += size;
    return block;
  });
}

function hallRows(count: number): number[] {
  return Array.from({ length: count }, (_, index) => count - index);
}

@Component({
  selector: 'app-theatre',
  imports: [CommonModule, TranslocoPipe, VipTheatreViewComponent],
  templateUrl: './theatre.component.html',
  styleUrl: './theatre.component.css'
})
export class TheatreComponent {
  @Input() embedded = false;
  @Input() movieTitle = '';
  @Input() set hallId(value: number | undefined) {
    if (value) {
      const hall = this.halls.find(item => item.id === value);
      if (hall) this.selectHall(hall);
    }
  }
  selectedSeats: Seat[] = [];
  focusedSeat: Seat | null = null;
  vipView: '3d' | '2d' | 'seat' | 'stage' = '3d';
  bookingError = '';
  halls: Hall[] = [
    { id: 1, name: 'Hall 1', type: 'Premium', detail: 'Dolby Atmos · 288 seats', layout: 'premium', rows: hallRows(12), blocks: seatBlocks([8, 8, 8]) },
    { id: 2, name: 'Hall 2', type: 'Standard', detail: 'Digital 2D · 240 seats', layout: 'standard', rows: hallRows(12), blocks: seatBlocks([10, 10]) },
    { id: 3, name: 'Hall 3', type: 'VIP', detail: 'Recliner seats · 96 seats', layout: 'vip', rows: hallRows(8), blocks: seatBlocks([4, 4, 4]) },
    { id: 4, name: 'Hall 4', type: 'Family', detail: 'Digital 2D · 180 seats', layout: 'family', rows: hallRows(9), blocks: seatBlocks([6, 8, 6]) }
  ];
  activeHall = this.halls[0];

  readonly occupiedSeats = new Set([
    '1-12-3', '1-10-17', '1-8-4', '1-5-11', '1-2-19',
    '2-11-2', '2-9-14', '2-6-8', '2-3-17',
    '3-7-3', '3-4-9', '3-2-6',
    '4-8-5', '4-6-13', '4-3-2', '4-1-18'
  ]);

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly cart: CartService
  ) {}

  getSeat(row: number, number: number): Seat {
    return {
      row,
      number,
      price: this.getPrice(row),
      status: this.occupiedSeats.has(`${this.activeHall.id}-${row}-${number}`) ? 'occupied' : 'available'
    };
  }

  selectSeat(seat: Seat): void {
    if (seat.status !== 'available') return;
    this.bookingError = '';

    const index = this.selectedSeats.findIndex(
      selected => selected.row === seat.row && selected.number === seat.number
    );

    if (index >= 0) {
      this.selectedSeats = this.selectedSeats.filter((_, seatIndex) => seatIndex !== index);
      if (this.focusedSeat?.row === seat.row && this.focusedSeat.number === seat.number) {
        this.focusedSeat = this.selectedSeats[this.selectedSeats.length - 1] ?? null;
        if (this.vipView !== '2d') this.vipView = '3d';
      }
      return;
    }

    this.selectedSeats = [...this.selectedSeats, seat];
    if (this.activeHall.layout === 'vip') {
      this.focusedSeat = seat;
      if (this.vipView !== '2d') this.vipView = 'seat';
    }
  }

  showVipView(view: '3d' | '2d' | 'stage'): void {
    if (view === 'stage' && !this.focusedSeat) return;
    this.vipView = view;
  }

  isSelected(row: number, number: number): boolean {
    return this.selectedSeats.some(seat => seat.row === row && seat.number === number);
  }

  get totalPrice(): number {
    return this.selectedSeats.reduce((total, seat) => total + seat.price, 0);
  }

  selectHall(hall: Hall): void {
    this.activeHall = hall;
    this.selectedSeats = [];
    this.focusedSeat = null;
    this.vipView = '3d';
    this.bookingError = '';
  }

  bookTicket(): void {
    if (!this.selectedSeats.length) return;

    if (this.auth.isLoggedIn()) {
      const hasDuplicate = this.selectedSeats.some(selectedSeat => this.cart.has({
        movie: this.movieTitle || 'Cinema screening',
        hall: this.activeHall.name,
        row: selectedSeat.row,
        seat: selectedSeat.number,
        price: selectedSeat.price
      }));

      if (hasDuplicate) {
        this.bookingError = 'theatre.duplicateTicket';
        return;
      }

      this.selectedSeats.forEach(selectedSeat => {
        this.cart.add({
          movie: this.movieTitle || 'Cinema screening',
          hall: this.activeHall.name,
          row: selectedSeat.row,
          seat: selectedSeat.number,
          price: selectedSeat.price
        });
      });
    }

    this.router.navigate(['/payment'], {
      queryParams: {
        movie: this.movieTitle || 'Cinema screening',
        hall: this.activeHall.name,
        row: this.selectedSeats.map(seat => seat.row).join(', '),
        seat: this.selectedSeats.map(seat => seat.number).join(', '),
        price: this.totalPrice
      }
    });
  }

  private getPrice(row: number): number {
    if (row <= 2) return 50;
    if (row <= 4) return 45;
    if (row <= 6) return 40;
    if (row <= 8) return 35;
    if (row <= 10) return 30;
    return 25;
  }
}
