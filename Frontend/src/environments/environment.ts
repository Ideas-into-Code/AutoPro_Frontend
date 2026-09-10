/**
 * Configuration de développement (valeur par défaut).
 *
 * `apiBaseUrl` reste relatif : `ng serve` proxifie `/api` et `/ws` vers
 * `localhost:8080` (voir `proxy.conf.json`).
 *
 * En production, ce fichier est remplacé par `environment.prod.ts`
 * (voir `fileReplacements` dans `angular.json`).
 */
export const environment = {
  production: false,
  /**
   * Racine des appels API.
   * - `/api` : même origine (dev via proxy, ou prod derrière un reverse-proxy).
   * - URL absolue (`https://mon-back.onrender.com/api`) : appel direct au backend.
   *   L'URL WebSocket STOMP en est déduite (`wss://mon-back.onrender.com/ws`).
   */
  apiBaseUrl: '/api',
};
