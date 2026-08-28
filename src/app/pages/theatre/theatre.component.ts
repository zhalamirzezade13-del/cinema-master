import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';
import { TranslocoPipe } from '@jsverse/transloco';
type Seat = {
  row: number;
  number: number;
  price: number;
  status: 'available' | 'occupied';
};

@Component({
  selector: 'app-theatre',
  imports: [CommonModule, TranslocoPipe],
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
  readonly rows = Array.from({ length: 12 }, (_, index) => 12 - index);
  readonly leftSeats = Array.from({ length: 12 }, (_, index) => 12 - index);
  readonly rightSeats = Array.from({ length: 12 }, (_, index) => index + 1);
  selectedSeat?: Seat;
  halls = [
    { id: 1, name: 'Hall 1', type: 'Premium', detail: 'Dolby Atmos · 288 seats' },
    { id: 2, name: 'Hall 2', type: 'Standard', detail: 'Digital 2D · 240 seats' },
    { id: 3, name: 'Hall 3', type: 'VIP', detail: 'Recliner seats · 96 seats' },
    { id: 4, name: 'Hall 4', type: 'Family', detail: 'Digital 2D · 180 seats' }
  ];
  activeHall = this.halls[0];

  private readonly occupiedSeats = new Set(['1-1', '1-2', '1-3', '2-1', '5-8', '8-4', '10-11']);

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
      status: this.occupiedSeats.has(`${row}-${number}`) ? 'occupied' : 'available'
    };
  }

  selectSeat(seat: Seat): void {
    if (seat.status === 'available') {
      this.selectedSeat = seat;
    }
  }

  selectHall(hall: typeof this.halls[number]): void {
    this.activeHall = hall;
    this.selectedSeat = undefined;
  }

  bookTicket(): void {
    if (!this.selectedSeat) return;

    if (this.auth.isLoggedIn()) {
      this.cart.add({
        movie: this.movieTitle || 'Cinema screening',
        hall: this.activeHall.name,
        row: this.selectedSeat.row,
        seat: this.selectedSeat.number,
        price: this.selectedSeat.price
      });
    }

    this.router.navigate(['/payment'], {
      queryParams: {
        movie: this.movieTitle || 'Cinema screening',
        hall: this.activeHall.name,
        row: this.selectedSeat.row,
        seat: this.selectedSeat.number,
        price: this.selectedSeat.price
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
