import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

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
    '[class.ap-price--flat]': 'flat()',
  },
})
export class PriceBreakdownCard {
  readonly price = input.required<PriceBreakdown>();

  /**
   * Intitulé de la dernière ligne.
   *
   * « Total à payer » avant le paiement, « Total payé » après : le même
   * composant sert les deux écrans, et seul le temps du verbe change.
   */
  readonly totalLabel = input('Total à payer');

  /**
   * Retire le cadre et l'ombre, pour une insertion dans une carte existante.
   * Deux cartes emboîtées donnent une bordure doublée et un décrochement.
   */
  readonly flat = input(false, { transform: booleanAttribute });

  /** Réexposé au gabarit : la mise en forme est commune à tout le projet. */
  protected readonly separerMilliers = separerMilliers;
}
