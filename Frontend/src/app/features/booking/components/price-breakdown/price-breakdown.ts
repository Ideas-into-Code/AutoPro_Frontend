import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { separerMilliers } from '@shared/utils/format-number';
import { PriceBreakdown } from '../../models/booking.model';

/**
 * Détail du prix, ligne à ligne, puis le total.
 *
 *   <app-price-breakdown [price]="reservation().price" />
 *
 * N'additionne rien : le total vient du serveur. Une somme refaite ici
 * finirait par diverger de celle qui est facturée — remise, arrondi ou taxe
 * qu'elle ne connaît pas — et c'est la facture qui fait foi.
 *
 * Rendu dans une `<dl>` : chaque montant est ainsi rattaché à son intitulé,
 * ce qu'une suite de `<div>` ne dit pas aux lecteurs d'écran.
 */
@Component({
  selector: 'app-price-breakdown',
  templateUrl: './price-breakdown.html',
  styleUrl: './price-breakdown.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-price',
  },
})
export class PriceBreakdownCard {
  readonly price = input.required<PriceBreakdown>();

  /** Réexposé au gabarit : la mise en forme est commune à tout le projet. */
  protected readonly separerMilliers = separerMilliers;
}
