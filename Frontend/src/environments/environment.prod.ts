/**
 * Configuration de production (build Vercel).
 *
 * ⚠️ À RENSEIGNER APRÈS LE DÉPLOIEMENT DU BACKEND SUR RENDER :
 * remplacer la valeur de `apiBaseUrl` par l'URL publique de l'API Render,
 * suffixée par `/api`, puis committer et pousser (Vercel redéploie seul).
 *
 *   apiBaseUrl: 'https://autopro-backend-xxxx.onrender.com/api',
 *
 * L'URL WebSocket STOMP est déduite automatiquement
 * (`https://…/api` → `wss://…/ws`).
 */
export const environment = {
  production: true,
  apiBaseUrl: '/api',
};
