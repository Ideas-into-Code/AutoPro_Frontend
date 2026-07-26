import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SpinnerSize = 'sm' | 'md' | 'lg';

/**
 * Indicateur de chargement.
 *
 *   <app-spinner label="Recherche des mécaniciens à proximité" />
 *
 * Le libellé n'est pas affiché mais annoncé par les lecteurs d'écran : un
 * chargement muet laisse les utilisateurs non voyants sans information.
 */
@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.html',
  styleUrl: './spinner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-spinner',
    '[class.ap-spinner--sm]': 'size() === "sm"',
    '[class.ap-spinner--md]': 'size() === "md"',
    '[class.ap-spinner--lg]': 'size() === "lg"',
    role: 'status',
  },
})
export class Spinner {
  readonly size = input<SpinnerSize>('md');
  readonly label = input('Chargement en cours');
}
