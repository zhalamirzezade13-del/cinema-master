import { TranslocoPipe } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminComponent } from '../admin.component';
import { Movie } from '../../../shared/movie-card/movie-card.component';

@Component({
  selector: 'app-admin-movies',
  imports: [CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './movies.component.html',
  styleUrl: '../admin-ui.css'
})
export class MoviesComponent {
  readonly admin = inject(AdminComponent);
  @ViewChild('editor', { static: true }) editor!: ElementRef<HTMLDialogElement>;
  @ViewChild('confirmation', { static: true }) confirmation!: ElementRef<HTMLDialogElement>;
  pendingDelete: Movie | null = null;
  search = '';
  get filteredMovies(): Movie[] {
    return this.admin.movies.filter(movie => movie.title.toLocaleLowerCase().includes(this.search.toLocaleLowerCase()));
  }
  open(movie?: Movie): void {
    if (movie) this.admin.openEditForm(movie);
    else this.admin.openAddForm();
    if (this.admin.showForm) this.editor.nativeElement.showModal();
  }
  close(): void {
    if (this.admin.saving) return;
    this.editor.nativeElement.close();
    this.admin.closeForm();
  }
  async save(): Promise<void> {
    await this.admin.saveMovie();
    if (!this.admin.showForm) this.editor.nativeElement.close();
  }
  askDelete(movie: Movie): void {
    this.admin.error = '';
    this.pendingDelete = movie;
    this.confirmation.nativeElement.showModal();
  }
  async remove(): Promise<void> {
    if (this.pendingDelete && await this.admin.deleteMovie(this.pendingDelete)) {
      this.confirmation.nativeElement.close();
      this.pendingDelete = null;
    }
  }
}
