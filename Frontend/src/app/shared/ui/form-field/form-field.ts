import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';

import { firstValidationMessage } from '../../validators/validation-messages';

export type FormFieldType = 'text' | 'email' | 'password' | 'tel' | 'number';

/** Compteur de module : garantit un identifiant unique par champ affiché. */
let prochainId = 0;

/**
 * Champ de formulaire du design system : libellé, saisie, aide et message
 * d'erreur, dans un seul composant.
 *
 *   <app-form-field
 *     label="Numéro de téléphone"
 *     type="tel"
 *     autocomplete="tel"
 *     hint="Un code de vérification vous sera envoyé."
 *     [control]="formulaire.controls.telephone"
 *     required
 *   />
 *
 * Le composant **possède** son `<input>` au lieu de le recevoir par
 * projection. C'est un choix assumé : il peut ainsi garantir seul la liaison
 * `label`/`for`, `aria-describedby` et `aria-invalid`. Si l'appelant devait
 * fournir l'input, il devrait aussi gérer ces liaisons — et les oublierait.
 *
 * Le composant n'affiche l'erreur qu'une fois le champ touché ou modifié :
 * reprocher un champ vide avant même que l'utilisateur l'ait atteint est
 * hostile.
 */
@Component({
  selector: 'app-form-field',
  imports: [ReactiveFormsModule],
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ap-form-field',
  },
})
export class FormField {
  readonly label = input.required<string>();
  readonly control = input.required<FormControl>();

  readonly type = input<FormFieldType>('text');
  readonly placeholder = input('');
  readonly autocomplete = input('');

  /** Texte d'aide, masqué dès qu'une erreur s'affiche pour ne pas surcharger. */
  readonly hint = input('');

  /** N'ajoute que l'indication visuelle : la contrainte vient du validateur. */
  readonly required = input(false, { transform: booleanAttribute });

  protected readonly fieldId = `ap-field-${prochainId++}`;
  protected readonly errorId = `${this.fieldId}-erreur`;
  protected readonly hintId = `${this.fieldId}-aide`;

  /**
   * Les contrôles de formulaire ne sont pas des signaux : sans cette
   * passerelle, un composant en `OnPush` n'afficherait jamais l'erreur.
   * `switchMap` réabonne proprement si le contrôle passé en entrée change.
   */
  private readonly controlEvents = toSignal(
    toObservable(this.control).pipe(switchMap((control) => control.events)),
    { initialValue: null },
  );

  protected readonly errorMessage = computed(() => {
    // Dépendance explicite : recalcule à chaque événement du contrôle.
    this.controlEvents();

    const control = this.control();

    if (control.valid || (!control.touched && !control.dirty)) {
      return null;
    }

    return firstValidationMessage(control.errors);
  });

  protected readonly describedBy = computed(() => {
    if (this.errorMessage() !== null) {
      return this.errorId;
    }

    return this.hint() === '' ? null : this.hintId;
  });
}
