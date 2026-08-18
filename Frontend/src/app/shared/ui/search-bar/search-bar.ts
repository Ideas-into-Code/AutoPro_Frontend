import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';

import { Icon } from '../icon/icon';

/** Compteur de module : garantit un identifiant unique par barre affichée. */
let prochainId = 0;

/**
 * Barre de recherche du design system.
 *
 *   <app-search-bar
 *     label="Rechercher un mécanicien"
 *     placeholder="Panne, spécialité, quartier…"
 *     [value]="terme()"
 *     (searchSubmit)="rechercher($event)"
 *   />
 *
 * Volontairement dépourvue de logique métier : elle ne sait ni ce qu'elle
 * cherche, ni où envoyer le résultat. Elle émet un terme nettoyé, et c'est
 * l'écran appelant qui décide d'appeler un dépôt ou de naviguer.
 *
 * Le balisage repose sur un `<form role="search">` natif plutôt que sur un
 * `(keydown.enter)` : la validation au clavier, le bouton « rechercher » du
 * clavier virtuel Android et l'annonce du repère de recherche par les lecteurs
 * d'écran sont alors acquis sans code.
 */
@Component({
  selector: 'app-search-bar',
  imports: [Icon],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-search-bar',
  },
})
export class SearchBar {
  /** Libellé accessible. Masqué visuellement : le champ se comprend seul. */
  readonly label = input.required<string>();

  readonly placeholder = input('');

  /** Terme initial, typiquement relu d'un paramètre d'URL. */
  readonly value = input('');

  /**
   * Émis à la validation, et à l'effacement (terme vide).
   *
   * Nommé `searchSubmit` et non `search` : un `<input type="search">` émet déjà
   * un événement DOM natif `search`, et une sortie homonyme rendrait le
   * gabarit appelant ambigu.
   */
  readonly searchSubmit = output<string>();

  protected readonly fieldId = `ap-search-${prochainId++}`;

  /**
   * `linkedSignal` plutôt que `signal` : la saisie reste locale, mais une
   * nouvelle valeur en entrée (retour arrière du navigateur, effacement d'un
   * filtre par l'écran parent) réinitialise le champ. Un `signal` simple
   * afficherait indéfiniment l'ancienne saisie.
   */
  protected readonly term = linkedSignal(() => this.value());

  protected onInput(value: string): void {
    this.term.set(value);
  }

  protected onSubmit(): void {
    this.searchSubmit.emit(this.term().trim());
  }

  /**
   * Effacer relance une recherche vide plutôt que de vider le seul champ :
   * l'utilisateur qui efface veut revoir la liste complète, pas rester devant
   * des résultats filtrés par un terme qui n'est plus affiché.
   */
  protected onClear(): void {
    this.term.set('');
    this.searchSubmit.emit('');
  }
}
