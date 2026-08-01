import { Routes } from '@angular/router';

/**
 * Routes du domaine « Accueil ».
 *
 * Cette feature ne correspond à aucun microservice, contrairement aux autres
 * (CONVENTIONS.md §1). L'exception est assumée : l'accueil est un écran
 * d'**agrégation**, dont le rôle est d'orienter vers les autres domaines. Le
 * loger dans `mechanics` ou `requests` reviendrait à donner à un domaine métier
 * la charge de présenter les autres.
 *
 * La règle de dépendance reste intacte : cette feature n'importe aucune autre
 * feature. Elle atteint les autres écrans par leur URL, jamais par un import.
 */
export const homeRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomePage),
    title: 'Accueil — AutoPro',
  },
];
