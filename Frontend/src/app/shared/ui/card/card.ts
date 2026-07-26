import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * Conteneur de contenu générique, avec trois emplacements de projection.
 *
 *   <app-card>
 *     <h3 card-title>Profil du mécanicien</h3>
 *     <p>Spécialités, tarifs, avis…</p>
 *     <button appButton card-actions>Contacter</button>
 *   </app-card>
 *
 * Volontairement ignorant du métier : la même carte sert à un profil de
 * mécanicien, à une demande d'intervention ou à une ligne de tarif.
 */
@Component({
  selector: 'app-card',
  templateUrl: './card.html',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-card',
    '[class.ap-card--flat]': 'flat()',
    '[class.ap-card--interactive]': 'interactive()',
  },
})
export class Card {
  /** Supprime l'ombre portée, pour une carte posée sur une surface déjà surélevée. */
  readonly flat = input(false, { transform: booleanAttribute });

  /**
   * Signale une carte cliquable dans son ensemble.
   * L'élément interactif reste à la charge de l'appelant : la carte se contente
   * de l'affordance visuelle, elle n'intercepte pas le clic.
   */
  readonly interactive = input(false, { transform: booleanAttribute });
}
