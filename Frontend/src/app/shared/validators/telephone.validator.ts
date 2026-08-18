import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Préfixes mobiles sénégalais en service (Orange, Free, Expresso, Promobile).
 * Les fixes en 33 sont exclus : l'authentification par OTP suppose un mobile.
 */
const PREFIXES_MOBILES = ['70', '75', '76', '77', '78'];

const INDICATIF_PAYS = '221';
const LONGUEUR_NATIONALE = 9;

/**
 * Ne conserve que les chiffres : l'utilisateur saisit indifféremment
 * « 77 123 45 67 », « +221771234567 » ou « 77-123-45-67 ».
 */
function chiffresSeuls(valeur: string): string {
  return valeur.replace(/\D/g, '');
}

/**
 * Valide un numéro de mobile sénégalais.
 *
 *   telephone: ['', [Validators.required, telephoneSenegalaisValidator]]
 *
 * Ne valide pas un champ vide : c'est le rôle de `Validators.required`, et
 * cumuler les deux responsabilités afficherait deux erreurs pour un champ
 * simplement non rempli.
 */
export function telephoneSenegalaisValidator(control: AbstractControl): ValidationErrors | null {
  const brut: unknown = control.value;

  if (typeof brut !== 'string' || brut.trim() === '') {
    return null;
  }

  let chiffres = chiffresSeuls(brut);

  if (chiffres.startsWith(INDICATIF_PAYS)) {
    chiffres = chiffres.slice(INDICATIF_PAYS.length);
  }

  const longueurValide = chiffres.length === LONGUEUR_NATIONALE;
  const prefixeValide = PREFIXES_MOBILES.some((prefixe) => chiffres.startsWith(prefixe));

  return longueurValide && prefixeValide ? null : { telephoneSenegalais: true };
}
