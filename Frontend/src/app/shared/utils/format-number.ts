/**
 * Mises en forme numériques partagées.
 *
 * Aucune logique métier : ces fonctions ne savent pas ce qu'elles comptent.
 * Elles vivent dans `shared/` parce que trois écrans affichaient des montants
 * et recopiaient la même ligne — la règle du projet veut qu'à la deuxième
 * occurrence, la chose remonte (CONVENTIONS.md §5).
 */

/**
 * Séparateurs de milliers imposés par `toLocaleString('fr-FR')`.
 *
 * Selon la version du moteur, ce peut être une espace insécable, une espace
 * insécable **étroite** ou une espace fine. Trois caractères invisibles et
 * distincts : une comparaison écrite avec l'espace du clavier échoue sur deux
 * d'entre eux, ce qui rend les tests faussement rouges et les recherches
 * plein-texte inopérantes. On les ramène donc tous à l'espace ordinaire.
 */
const ESPACES_DE_GROUPEMENT = /[\u00A0\u202F\u2009]/g;

/** « 145500 » → « 145 500 », avec des espaces ordinaires. */
export function separerMilliers(valeur: number): string {
  return valeur.toLocaleString('fr-FR').replace(ESPACES_DE_GROUPEMENT, ' ');
}

/**
 * Abrège les grands nombres : « 8 400 000 » → « 8,4 M ».
 *
 * Réservé aux indicateurs de synthèse, où l'ordre de grandeur prime sur le
 * détail et où la place manque. Les valeurs inférieures au million sont
 * rendues intactes : abréger « 842 » n'apporterait rien et ferait perdre de
 * l'information.
 */
export function abregerNombre(valeur: number): string {
  const MILLION = 1_000_000;

  if (Math.abs(valeur) < MILLION) {
    return separerMilliers(valeur);
  }

  const millions = valeur / MILLION;

  // Une décimale, et seulement si elle apporte quelque chose : « 8,4 M » se
  // lit mieux que « 8,40 M », et « 12 M » mieux que « 12,0 M ».
  const arrondi = Math.round(millions * 10) / 10;

  return `${arrondi.toLocaleString('fr-FR')} M`;
}
