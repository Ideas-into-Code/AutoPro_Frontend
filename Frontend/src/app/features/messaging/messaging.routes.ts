import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';

/**
 * Routes du domaine « Messagerie » : conversations et fil de discussion,
 * branchés sur `/api/chat` (REST) et STOMP `/topic/chat/{id}` (temps réel).
 */
export const messagingRoutes: Routes = [
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () => import('./pages/chat/chat').then((m) => m.ChatPage),
    title: 'Messages — AutoPro',
  },
];
