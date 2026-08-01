import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';

import { Position, PositionError, PositionErrorKind, PositionProvider } from '@core';
import { Button, FormField, Icon, Spinner } from '@shared/ui';

/** Messages destinés à l'utilisateur, un par motif d'échec du relevé. */
const MESSAGES_ERREUR: Readonly<Record<PositionErrorKind, string>> = {
  refusee:
    "Vous avez refusé le partage de votre position. Indiquez l'adresse à la main, cela suffit.",
  indisponible: "Votre position n'a pas pu être déterminée. Indiquez l'adresse à la main.",
  'delai-depasse': 'Le relevé GPS a pris trop de temps. Réessayez ou saisissez votre adresse.',
  'non-supportee': "Cet appareil ne propose pas la géolocalisation. Indiquez l'adresse à la main.",
};

/**
 * Choix du lieu de l'intervention : adresse saisie, position GPS, ou les deux.
 *
 *   <app-location-picker [addressControl]="form.controls.adresse" (positionChange)="…">
 *     <app-map map />
 *   </app-location-picker>
 *
 * **L'adresse seule suffit.** Le GPS est un confort, jamais une condition : un
 * automobiliste qui refuse la géolocalisation, ou dont le téléphone ne capte
 * pas sous un pont, doit pouvoir signaler sa panne. C'est la raison pour
 * laquelle la position est émise à part et n'entre pas dans la validation du
 * formulaire.
 *
 * L'emplacement `[map]` est laissé libre : la carte interactive du ticket #7
 * s'y projettera telle quelle, sans qu'une ligne de ce composant ni du
 * formulaire ne change (principe ouvert/fermé, comme `PageShell` avec son
 * en-tête).
 */
@Component({
  selector: 'app-location-picker',
  imports: [Button, FormField, Icon, Spinner],
  templateUrl: './location-picker.html',
  styleUrl: './location-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-location-picker',
  },
})
export class LocationPicker {
  /** Contrôle de l'adresse, porté par le formulaire de l'écran appelant. */
  readonly addressControl = input.required<FormControl<string>>();

  /** Émis à chaque relevé réussi, et à `null` si l'utilisateur l'abandonne. */
  readonly positionChange = output<Position | null>();

  private readonly positions = inject(PositionProvider);

  /**
   * Capturé à la construction : `takeUntilDestroyed()` ne sait retrouver seul
   * le contexte d'injection que dans un initialiseur de champ, pas dans une
   * méthode appelée sur un clic.
   */
  private readonly destroyRef = inject(DestroyRef);

  protected readonly position = signal<Position | null>(null);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected localiser(): void {
    this.enCours.set(true);
    this.erreur.set(null);

    this.positions
      .current()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (relevee) => {
          this.enCours.set(false);
          this.position.set(relevee);
          this.positionChange.emit(relevee);
        },
        error: (cause: unknown) => {
          this.enCours.set(false);
          this.position.set(null);
          this.positionChange.emit(null);
          this.erreur.set(this.traduire(cause));
        },
      });
  }

  protected oublier(): void {
    this.position.set(null);
    this.erreur.set(null);
    this.positionChange.emit(null);
  }

  /** Arrondi à cinq décimales : environ un mètre, largement assez ici. */
  protected formater(valeur: number): string {
    return valeur.toFixed(5);
  }

  /**
   * Arrondi de la précision affichée. Fait en TypeScript plutôt qu'avec le
   * pipe `number` : cela évite d'embarquer `DecimalPipe` et ses données de
   * locale pour un simple entier.
   */
  protected arrondir(valeur: number): number {
    return Math.round(valeur);
  }

  private traduire(cause: unknown): string {
    if (cause instanceof PositionError) {
      return MESSAGES_ERREUR[cause.kind];
    }

    return MESSAGES_ERREUR.indisponible;
  }
}
