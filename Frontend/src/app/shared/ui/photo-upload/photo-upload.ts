import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { Icon } from '../icon/icon';

/** Photo retenue, avec l'URL locale qui sert à son aperçu. */
interface PhotoSelectionnee {
  readonly id: string;
  readonly file: File;
  readonly previewUrl: string;
}

/** Compteur de module : identifie chaque photo sans dépendre de son nom. */
let prochainId = 0;

const OCTETS_PAR_MO = 1024 * 1024;

/**
 * Ajout de photos, avec aperçu et retrait.
 *
 *   <app-photo-upload [maxPhotos]="3" (photosChange)="photos.set($event)" />
 *
 * Remonté de `features/requests/` vers `shared/ui/` : le formulaire d'avis en a
 * besoin lui aussi, et une feature n'a pas le droit d'en importer une autre
 * (CONVENTIONS.md §1). Le composant ne sait rien de ce que montrent les photos
 * — une panne déclarée ou un travail terminé — et n'appartient donc à aucun
 * des deux domaines.
 *
 * Les fichiers restent **hors du formulaire réactif**, et c'est délibéré : un
 * `FormControl` ne peut pas porter un `File` (on ne peut pas assigner de valeur
 * à un `<input type="file">` pour des raisons de sécurité). Les y forcer
 * imposerait un `ControlValueAccessor` qui ne saurait jamais restaurer son
 * état. Le composant émet donc sa sélection, et l'écran la joint au brouillon
 * au moment de l'envoi.
 *
 * Les aperçus passent par `URL.createObjectURL` plutôt que par un
 * `FileReader` en base64 : pas de copie de l'image en mémoire, ce qui compte
 * pour une photo de 4 Mo prise au téléphone. En contrepartie chaque URL doit
 * être libérée, ce dont le composant se charge.
 */
@Component({
  selector: 'app-photo-upload',
  imports: [Icon],
  templateUrl: './photo-upload.html',
  styleUrl: './photo-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-photo-upload',
  },
})
export class PhotoUpload {
  readonly maxPhotos = input(3);

  /** Taille maximale d'une photo, en mégaoctets. */
  readonly maxSizeMo = input(5);

  readonly photosChange = output<readonly File[]>();

  protected readonly fieldId = `ap-photos-${prochainId++}`;

  protected readonly photos = signal<readonly PhotoSelectionnee[]>([]);

  /**
   * Fichiers écartés et pourquoi. Refuser en silence laisserait l'utilisateur
   * croire que sa photo est jointe alors qu'elle ne partira jamais.
   */
  protected readonly rejets = signal<readonly string[]>([]);

  protected readonly placesRestantes = computed(() => this.maxPhotos() - this.photos().length);

  protected readonly estPleine = computed(() => this.placesRestantes() <= 0);

  constructor() {
    // Sans cette libération, chaque photo prévisualisée resterait en mémoire
    // jusqu'au rechargement complet de la page.
    inject(DestroyRef).onDestroy(() => {
      for (const photo of this.photos()) {
        URL.revokeObjectURL(photo.previewUrl);
      }
    });
  }

  protected ajouter(fichiers: FileList | null): void {
    if (fichiers === null) {
      return;
    }

    const retenues: PhotoSelectionnee[] = [];
    const refus: string[] = [];
    let placesRestantes = this.placesRestantes();

    for (const file of Array.from(fichiers)) {
      const motif = this.motifDeRefus(file, placesRestantes);

      if (motif !== null) {
        refus.push(motif);
        continue;
      }

      retenues.push({
        id: `photo-${prochainId++}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
      placesRestantes -= 1;
    }

    this.rejets.set(refus);

    if (retenues.length > 0) {
      this.photos.update((actuelles) => [...actuelles, ...retenues]);
      this.emettre();
    }
  }

  protected retirer(id: string): void {
    const photo = this.photos().find((candidate) => candidate.id === id);

    if (photo === undefined) {
      return;
    }

    URL.revokeObjectURL(photo.previewUrl);
    this.photos.update((actuelles) => actuelles.filter((candidate) => candidate.id !== id));
    this.rejets.set([]);
    this.emettre();
  }

  /** Renvoie le motif de refus, ou `null` si la photo est acceptable. */
  private motifDeRefus(file: File, placesRestantes: number): string | null {
    if (placesRestantes <= 0) {
      return `${file.name} : ${this.maxPhotos()} photos au maximum.`;
    }

    if (!file.type.startsWith('image/')) {
      return `${file.name} : seules les images sont acceptées.`;
    }

    if (file.size > this.maxSizeMo() * OCTETS_PAR_MO) {
      return `${file.name} : ${this.maxSizeMo()} Mo au maximum.`;
    }

    return null;
  }

  private emettre(): void {
    this.photosChange.emit(this.photos().map((photo) => photo.file));
  }
}
