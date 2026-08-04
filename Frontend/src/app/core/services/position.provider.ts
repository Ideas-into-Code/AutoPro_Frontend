import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError } from 'rxjs';

/** Coordonnées géographiques, en degrés décimaux. */
export interface Position {
  readonly latitude: number;
  readonly longitude: number;

  /** Précision estimée du relevé, en mètres. */
  readonly accuracyMeters: number;
}

/**
 * Motifs d'échec, traduits en vocabulaire métier.
 *
 * L'interface ne doit jamais raisonner sur les codes numériques de l'API du
 * navigateur, pour la même raison qu'elle ne raisonne pas sur les codes HTTP :
 * `PERMISSION_DENIED` vaut 1, et un `1` dans un composant n'apprend rien à
 * personne. C'est le même motif d'adaptateur que `toApiError()`.
 */
export type PositionErrorKind =
  /** L'utilisateur a refusé le partage de sa position. */
  | 'refusee'
  /** Le navigateur n'a pas pu déterminer la position (GPS, réseau). */
  | 'indisponible'
  /** Le relevé a dépassé le délai imparti. */
  | 'delai-depasse'
  /** Le navigateur ne propose pas de géolocalisation, ou on est côté serveur. */
  | 'non-supportee';

export class PositionError extends Error {
  constructor(readonly kind: PositionErrorKind) {
    super(`Position indisponible : ${kind}`);
    this.name = 'PositionError';
  }
}

/**
 * Accès à la position de l'appareil.
 *
 * Classe abstraite, donc contrat **et** jeton d'injection — même motif que les
 * dépôts de données. Elle permet à un test de fournir une position fixe : la
 * vraie API du navigateur demande une autorisation à l'utilisateur, ce qu'aucun
 * test automatisé ne peut accorder.
 *
 * Placée dans `core` et non dans la feature « géolocalisation » : c'est une
 * enveloppe autour d'une API du navigateur, pas une règle métier. Le formulaire
 * de signalement et la carte interactive en dépendront tous les deux, et une
 * feature ne doit jamais en importer une autre.
 */
export abstract class PositionProvider {
  abstract current(): Observable<Position>;
}

/** Délai au-delà duquel on cesse d'attendre un relevé GPS. */
const DELAI_MS = 10_000;

/**
 * Implémentation réelle, adossée à `navigator.geolocation`.
 *
 * Renvoie une erreur explicite côté serveur au lieu de planter : le rendu SSR
 * exécute le même code, et `navigator` n'y existe pas.
 */
export class BrowserPositionProvider extends PositionProvider {
  private readonly platformId = inject(PLATFORM_ID);

  current(): Observable<Position> {
    if (!isPlatformBrowser(this.platformId) || !('geolocation' in navigator)) {
      return throwError(() => new PositionError('non-supportee'));
    }

    return new Observable<Position>((subscriber) => {
      navigator.geolocation.getCurrentPosition(
        (releve) => {
          subscriber.next({
            latitude: releve.coords.latitude,
            longitude: releve.coords.longitude,
            accuracyMeters: releve.coords.accuracy,
          });
          subscriber.complete();
        },
        (erreur) => subscriber.error(new PositionError(traduire(erreur))),
        { enableHighAccuracy: true, timeout: DELAI_MS, maximumAge: 0 },
      );
    });
  }
}

/**
 * Codes d'erreur de l'API de géolocalisation, recopiés plutôt que lus sur le
 * global `GeolocationPositionError` : celui-ci n'existe ni pendant le rendu
 * serveur, ni dans l'environnement de test. Ce sont des constantes figées par
 * la spécification du W3C, elles ne bougeront pas.
 */
const CODE_PERMISSION_REFUSEE = 1;
const CODE_DELAI_DEPASSE = 3;

/** Adaptateur des codes numériques du navigateur vers le vocabulaire métier. */
function traduire(erreur: GeolocationPositionError): PositionErrorKind {
  switch (erreur.code) {
    case CODE_PERMISSION_REFUSEE:
      return 'refusee';
    case CODE_DELAI_DEPASSE:
      return 'delai-depasse';
    default:
      return 'indisponible';
  }
}
