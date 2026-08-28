import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment',
  imports: [CommonModule, RouterLink],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent {
  booking = { movie: 'Cinema screening', hall: '', row: '', seat: '', price: '' };

  constructor(route: ActivatedRoute) {
    route.queryParamMap.subscribe(params => {
      this.booking = {
        movie: params.get('movie') ?? 'Cinema screening',
        hall: params.get('hall') ?? '',
        row: params.get('row') ?? '',
        seat: params.get('seat') ?? '',
        price: params.get('price') ?? ''
      };
    });
  }
}
