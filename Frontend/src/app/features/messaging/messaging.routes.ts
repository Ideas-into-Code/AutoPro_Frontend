import { Routes } from '@angular/router';

/**
 * Routes du domaine « Messagerie ».
 * Chat temps réel et bouton d'appel direct.
 *
 * Structure attendue dans ce dossier (CONVENTIONS.md §1) :
 *   data/        dépôts d'accès au microservice « messaging »
 *   models/      types propres au domaine
 *   components/  composants réutilisés dans cette feature uniquement
 *   pages/       composants routés, à déclarer ci-dessous
 *
 * À remplir par le ticket dédié.
 */
export const messagingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/chat/chat').then((m) => m.ChatPage),
    title: 'Messages — AutoPro',
  },
];
