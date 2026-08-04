import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

/**
 * Validateurs standard d'Angular, réexportés sous forme de fonctions libres.
 *
 * Pourquoi cette indirection : `Validators.required` est une **méthode
 * statique**. La passer telle quelle (`[Validators.required]`) la détache de sa
 * classe, ce que la règle de lint `unbound-method` signale à juste titre.
 *
 * La parade évidente est d'écrire `(c) => Validators.required(c)` dans chaque
 * formulaire — c'est ce qu'on trouve aujourd'hui dans les écrans
 * d'authentification, à raison de deux lignes par champ. Elle fonctionne, mais
 * se recopie indéfiniment.
 *
 * L'enveloppe est donc écrite **une seule fois ici**, et les formulaires
 * redeviennent lisibles :
 *
 *   description: this.fb.nonNullable.control('', [requis, longueurMin(20)]),
 *
 * Les messages d'erreur correspondants vivent déjà dans
 * `validation-messages.ts` : les clés produites sont celles d'Angular
 * (`required`, `email`, `minlength`…), rien à y ajouter.
 */

/** Champ obligatoire. */
export const requis: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  Validators.required(control);

/** Adresse électronique syntaxiquement valide. */
export const emailValide: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  Validators.email(control);

/** Longueur minimale, en caractères. */
export function longueurMin(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => Validators.minLength(min)(control);
}

/** Longueur maximale, en caractères. */
export function longueurMax(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => Validators.maxLength(max)(control);
}
