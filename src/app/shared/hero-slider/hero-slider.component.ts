import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-hero-slider',
  imports: [CommonModule, TranslocoPipe, RouterLink],
  templateUrl: './hero-slider.component.html',
  styleUrl: './hero-slider.component.css'
})
export class HeroSliderComponent {
  @ViewChild('trailerDialog', { static: true }) trailerDialog!: ElementRef<HTMLDialogElement>;
  trailerOpen = false;

  openTrailer(): void {
    this.trailerOpen = true;
    this.trailerDialog.nativeElement.showModal();
  }

  closeTrailer(): void {
    this.trailerDialog.nativeElement.close();
    this.trailerOpen = false;
  }
}
