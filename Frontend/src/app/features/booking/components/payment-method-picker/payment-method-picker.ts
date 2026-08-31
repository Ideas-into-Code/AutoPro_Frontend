import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { PaymentMethod, PaymentMethodId } from '../../models/booking.model';

/** Compteur de module : garantit un nom de groupe unique par sélecteur affiché. */
let prochainId = 0;

/**
 * Choix du moyen de paiement.
 *
 *   <app-payment-method-picker
 *     [methods]="moyens()"
 *     [selected]="moyenChoisi()"
 *     (methodChange)="choisir($event)"
 *   />
 *
 * Repose sur de **vrais `<input type="radio">`** plutôt que sur des cartes
 * cliquables. Le groupe se parcourt alors aux flèches, s'annonce comme « 1 sur
 * 3 », et un seul choix reste possible — trois comportements qu'il faudrait
 * sinon réécrire à la main, et qu'on oublierait.
 *
 * Le composant ne choisit rien : il émet, et l'écran décide. Un moyen
 * indisponible est désactivé plutôt que masqué, pour que le client sache qu'il
 * existe et qu'il reviendra.
 */
@Component({
  selector: 'app-payment-method-picker',
  templateUrl: './payment-method-picker.html',
  styleUrl: './payment-method-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-methods',
  },
})
export class PaymentMethodPicker {
  readonly methods = input.required<readonly PaymentMethod[]>();

  /** Moyen actuellement retenu, ou `null` tant que le client n'a pas choisi. */
  readonly selected = input<PaymentMethodId | null>(null);

  /** Neutralise le groupe entier pendant que le paiement part. */
  readonly disabled = input(false);

  readonly methodChange = output<PaymentMethodId>();

  protected readonly groupe = `ap-payment-method-${prochainId++}`;

  protected choisir(id: PaymentMethodId): void {
    this.methodChange.emit(id);
  }
}
