import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-hero-slider',
  imports: [TranslocoPipe, RouterLink],
  templateUrl: './hero-slider.component.html',
  styleUrl: './hero-slider.component.css'
})
export class HeroSliderComponent {

}
