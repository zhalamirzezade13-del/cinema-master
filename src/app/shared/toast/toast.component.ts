import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-toast',
  imports: [TranslocoPipe],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent {
  readonly toast = inject(ToastService);
}
