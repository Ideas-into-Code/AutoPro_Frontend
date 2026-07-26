import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Bouton du design system.
 *
 * Le sélecteur porte sur un `<button>` natif plutôt que sur une balise
 * `<app-button>` : pas de bouton imbriqué, et on conserve gratuitement la
 * navigation au clavier, le rôle ARIA et la soumission de formulaire.
 *
 *   <button appButton variant="primary" [loading]="enCours()">Enregistrer</button>
 *   <button appButton variant="ghost" size="sm" type="button">Annuler</button>
 *
 * Ne porte aucune logique métier : c'est au composant appelant de décider ce
 * que fait le clic (responsabilité unique).
 */
@Component({
  selector: 'button[appButton]',
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-button',
    '[class.ap-button--primary]': 'variant() === "primary"',
    '[class.ap-button--secondary]': 'variant() === "secondary"',
    '[class.ap-button--ghost]': 'variant() === "ghost"',
    '[class.ap-button--danger]': 'variant() === "danger"',
    '[class.ap-button--sm]': 'size() === "sm"',
    '[class.ap-button--md]': 'size() === "md"',
    '[class.ap-button--lg]': 'size() === "lg"',
    '[class.ap-button--block]': 'fullWidth()',
    '[class.ap-button--loading]': 'loading()',
    '[disabled]': 'isDisabled()',
    '[attr.aria-busy]': 'loading()',
  },
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');

  /** Occupe toute la largeur disponible — utile sur mobile. */
  readonly fullWidth = input(false, { transform: booleanAttribute });

  /** Affiche l'indicateur de chargement et neutralise le bouton. */
  readonly loading = input(false, { transform: booleanAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });

  /** Un bouton en cours de chargement ne doit pas pouvoir être re-cliqué. */
  protected readonly isDisabled = computed(() => this.disabled() || this.loading());
}
