import { HttpErrorResponse } from '@angular/common/http';

/**
 * Catégories d'erreur exploitables par l'interface. Traduire le HTTP en
 * vocabulaire métier évite que chaque composant réinterprète des codes 4xx/5xx.
 */
export type ApiErrorKind =
  | 'offline' // aucune connexion réseau
  | 'timeout' // le serveur n'a pas répondu à temps
  | 'unauthorized' // session absente ou expirée
  | 'forbidden' // authentifié mais droits insuffisants
  | 'notFound'
  | 'validation' // charge utile refusée par le serveur
  | 'conflict'
  | 'server' // 5xx
  | 'unknown';

/** Erreur normalisée, seule forme d'erreur que les features manipulent. */
export interface ApiError {
  readonly kind: ApiErrorKind;
  readonly status: number;
  /** Message destiné à l'utilisateur, en français. */
  readonly message: string;
  /** Erreurs par champ, renseignées pour `kind === 'validation'`. */
  readonly fieldErrors?: Readonly<Record<string, string>>;
}

const MESSAGES: Readonly<Record<ApiErrorKind, string>> = {
  offline: 'Connexion indisponible. Vérifiez votre réseau puis réessayez.',
  timeout: 'Le serveur met trop de temps à répondre. Réessayez dans un instant.',
  unauthorized: 'Votre session a expiré. Veuillez vous reconnecter.',
  forbidden: "Vous n'avez pas les droits nécessaires pour cette action.",
  notFound: "La ressource demandée n'existe pas ou a été supprimée.",
  validation: 'Certaines informations sont invalides. Corrigez-les puis réessayez.',
  conflict: 'Cette opération entre en conflit avec des données existantes.',
  server: "Une erreur est survenue de notre côté. L'équipe a été prévenue.",
  unknown: 'Une erreur inattendue est survenue.',
};

function kindFromStatus(status: number): ApiErrorKind {
  // Angular utilise le statut 0 quand la requête n'a jamais atteint le serveur.
  if (status === 0) {
    return 'offline';
  }

  switch (status) {
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'notFound';
    case 408:
      return 'timeout';
    case 409:
      return 'conflict';
    case 422:
      return 'validation';
    default:
      return status >= 500 ? 'server' : 'unknown';
  }
}

/**
 * Traduit une réponse d'erreur HTTP en `ApiError`.
 * Fonction pure : testable sans conteneur d'injection ni serveur factice.
 */
export function toApiError(response: HttpErrorResponse): ApiError {
  const kind = kindFromStatus(response.status);
  const body: unknown = response.error;

  // Le backend peut préciser un message et des erreurs par champ ; on préfère
  // toujours son message s'il est exploitable, sinon on retombe sur le nôtre.
  // `'message' in body` suffit à restreindre le type : pas besoin d'assertion.
  const detail =
    typeof body === 'object' && body !== null && 'message' in body
      ? String(body.message)
      : undefined;

  const fieldErrors =
    typeof body === 'object' && body !== null && 'errors' in body
      ? (body as { errors?: Readonly<Record<string, string>> }).errors
      : undefined;

  return {
    kind,
    status: response.status,
    message: detail && detail.trim() !== '' ? detail : MESSAGES[kind],
    ...(fieldErrors ? { fieldErrors } : {}),
  };
}
