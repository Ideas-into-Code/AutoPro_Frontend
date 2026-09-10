import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  signal,
} from '@angular/core';

/**
 * Galerie de photos avec agrandissement dans la page.
 *
 *   <app-photo-gallery [photos]="d.photoUrls" alt="Photo jointe par le client" />
 *
 * Les vignettes ouvrent une visionneuse en superposition (pas un nouvel onglet) :
 * fond assombri, navigation précédent / suivant au clic ou au clavier
 * (flèches, Échap pour fermer).
 */
@Component({
  selector: 'app-photo-gallery',
  standalone: true,
  templateUrl: './photo-gallery.html',
  styleUrl: './photo-gallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoGallery {
  readonly photos = input<readonly string[]>([]);
  readonly alt = input('Photo');

  protected readonly openIndex = signal<number | null>(null);

  protected readonly current = computed(() => {
    const i = this.openIndex();
    return i === null ? null : (this.photos()[i] ?? null);
  });

  protected readonly hasMultiple = computed(() => this.photos().length > 1);

  protected open(index: number): void {
    this.openIndex.set(index);
  }

  protected close(): void {
    this.openIndex.set(null);
  }

  protected prev(event?: Event): void {
    event?.stopPropagation();
    this.step(-1);
  }

  protected next(event?: Event): void {
    event?.stopPropagation();
    this.step(1);
  }

  private step(delta: number): void {
    const total = this.photos().length;
    const i = this.openIndex();
    if (i === null || total === 0) {
      return;
    }
    this.openIndex.set((i + delta + total) % total);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (this.openIndex() === null) {
      return;
    }
    switch (event.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowLeft':
        this.prev();
        break;
      case 'ArrowRight':
        this.next();
        break;
    }
  }
}
