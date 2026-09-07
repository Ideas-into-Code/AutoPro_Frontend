import { Routes } from '@angular/router';

import { MechanicRepository } from './data/mechanic.repository';
import { HttpMechanicRepository } from './data/mechanic.repository.http';

/**
 * Routes du domaine « Mécaniciens ».
 * Profils, spécialités, diplômes validés, notes.
 *
 * Structure de ce dossier (CONVENTIONS.md §1) :
 *   data/        dépôts d'accès au microservice « mechanics »
 *   models/      types propres au domaine
 *   components/  composants réutilisés dans cette feature uniquement
 *   pages/       composants routés, déclarés ci-dessous
 *
 * Le profil détaillé (`/mecaniciens/:id`) reste à écrire : la liste y renvoie
 * déjà, il n'y aura qu'une route enfant à ajouter ci-dessous.
 */
export const mechanicsRoutes: Routes = [
  {
    path: '',

    /**
     * POINT DE BASCULE DU DOMAINE « MÉCANICIENS ».
     *
     * Le jour où le microservice répond, cette ligne devient :
     *
     *   { provide: MechanicRepository, useClass: HttpMechanicRepository }
     *
     * Rien d'autre ne bouge : l'écran dépend de la classe abstraite.
     *
     * Le dépôt est fourni ici, sur la route, et non dans `provideCore()` :
     * seul ce domaine s'en sert, et le déclarer globalement ferait entrer les
     * données simulées dans le bundle initial de tous les utilisateurs.
     */
    providers: [{ provide: MechanicRepository, useClass: HttpMechanicRepository }],

    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/mechanic-list/mechanic-list').then((m) => m.MechanicListPage),
        title: 'Mécaniciens — AutoPro',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/mechanic-profile/mechanic-profile').then((m) => m.MechanicProfilePage),
        title: 'Profil du mécanicien — AutoPro',
      },
    ],
  },
];
