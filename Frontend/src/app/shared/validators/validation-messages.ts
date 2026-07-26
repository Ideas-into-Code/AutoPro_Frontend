import { ValidationErrors } from '@angular/forms';

/**
 * Traduction des erreurs de validation en messages destinés à l'utilisateur.
 *
 * Centralisé ici pour deux raisons : les messages restent homogènes dans toute
 * l'application, et un écran n'a jamais à écrire « Ce champ est obligatoire »
 * en dur. Ajouter un validateur, c'est ajouter une entrée ici.
 */

/** Extrait un nombre d'un détail d'erreur, sans faire confiance à sa forme. */
function readNumber(detail: unknown, key: string): number | null {
  if (typeof detail === 'object' && detail !== null && key in detail) {
    const value = (detail as Record<string, unknown>)[key];

    return typeof value === 'number' ? value : null;
  }

  return null;
}

const MESSAGES: Readonly<Record<string, (detail: unknown) => string>> = {
  required: () => 'Ce champ est obligatoire.',

  email: () => "Cette adresse e-mail n'est pas valide.",

  minlength: (detail) => {
    const min = readNumber(detail, 'requiredLength');

    return min === null ? 'Valeur trop courte.' : `Au moins ${min} caractères sont attendus.`;
  },

  maxlength: (detail) => {
    const max = readNumber(detail, 'requiredLength');

    return max === null ? 'Valeur trop longue.' : `${max} caractères au maximum.`;
  },

  min: (detail) => {
    const min = readNumber(detail, 'min');

    return min === null ? 'Valeur trop petite.' : `La valeur minimale est ${min}.`;
  },

  max: (detail) => {
    const max = readNumber(detail, 'max');

    return max === null ? 'Valeur trop grande.' : `La valeur maximale est ${max}.`;
  },

  telephoneSenegalais: () =>
    "Ce numéro n'est pas un mobile sénégalais valide (exemple : 77 123 45 67).",

  motsDePasseDifferents: () => 'Les deux mots de passe ne correspondent pas.',

  pattern: () => "Le format saisi n'est pas accepté.",
};

/**
 * Renvoie le message de la première erreur d'un contrôle, ou `null` s'il est
 * valide. On n'affiche qu'un message à la fois : empiler trois reproches sous
 * un même champ est illisible.
 */
export function firstValidationMessage(errors: ValidationErrors | null): string | null {
  if (errors === null) {
    return null;
  }

  for (const [key, detail] of Object.entries(errors)) {
    const build = MESSAGES[key];

    if (build !== undefined) {
      return build(detail);
    }
  }

  // Validateur sans message déclaré : on reste générique plutôt que d'afficher
  // une clé technique à l'utilisateur.
  return 'Cette valeur est invalide.';
}
