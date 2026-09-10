/**
 * Configuration de production (build Vercel).
 *
 * `apiBaseUrl` pointe sur l'API Render (suffixe `/api`). L'URL WebSocket STOMP
 * en est déduite automatiquement (`https://…/api` → `wss://…/ws`).
 * Pour changer de backend : modifier cette ligne, committer, pousser — Vercel
 * redéploie seul.
 */
export const environment = {
  production: true,
  apiBaseUrl: 'https://autopro-backend-62y8.onrender.com/api',
};
