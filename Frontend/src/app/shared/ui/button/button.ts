import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Bouton du design system.
 *
 * S'applique par attribut sur un élément natif plutôt que par une balise
 * `<app-button>` : pas de bouton imbriqué, et on conserve gratuitement la
 * navigation au clavier, le rôle ARIA et la soumission de formulaire.
 *
 *   <button appButton variant="primary" [loading]="enCours()">Enregistrer</button>
 *   <button appButton variant="ghost" size="sm" type="button">Annuler</button>
 *   <a appButton routerLink="/">Retour à l'accueil</a>
 *
 * Les deux formes sont acceptées, et le choix n'est pas cosmétique :
 * `<button>` déclenche une ACTION, `<a>` provoque une NAVIGATION. Utiliser un
 * bouton pour naviguer casse le clic milieu, l'ouverture dans un nouvel onglet
 * et l'annonce du lecteur d'écran.
 *
 * Ne porte aucune logique métier : c'est au composant appelant de décider ce
 * que fait le clic (responsabilité unique).
 */
@Component({
  selector: 'button[appButton], a[appButton]',
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
    '[class.ap-button--disabled]': 'isDisabled()',
    // `disabled` n'existe pas sur un <a> : on ne pose l'attribut que sur un
    // vrai bouton, et on retombe sur aria-disabled + tabindex pour les liens.
    '[attr.disabled]': 'isNativeButton && isDisabled() ? "" : null',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.tabindex]': '!isNativeButton && isDisabled() ? -1 : null',
    '[attr.aria-busy]': 'loading()',
  },
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');

  /** Occupe toute la largeur disponible — utile sur mobile. */
  readonly fullWidth = input(false, { transform: booleanAttribute });

  /** Affiche l'indicateur de chargement et neutralise l'élément. */
  readonly loading = input(false, { transform: booleanAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });

  /** Un élément en cours de chargement ne doit pas pouvoir être re-cliqué. */
  protected readonly isDisabled = computed(() => this.disabled() || this.loading());

  protected readonly isNativeButton =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'BUTTON';
}
