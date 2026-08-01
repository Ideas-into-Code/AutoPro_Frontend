import { Routes } from '@angular/router';

import { MechanicRepository } from './data/mechanic.repository';
import { MockMechanicRepository } from './data/mechanic.repository.mock';

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
    providers: [{ provide: MechanicRepository, useClass: MockMechanicRepository }],

    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/mechanic-list/mechanic-list').then((m) => m.MechanicListPage),
        title: 'Mécaniciens — AutoPro',
      },
      {
        // Profil détaillé, à écrire. Déclaré dès maintenant pour que la liste
        // n'envoie pas sur la page 404 : l'adresse est correcte, c'est l'écran
        // qui manque. Annoncer « page introuvable » ferait croire à une erreur
        // de l'utilisateur alors que le tort est de notre côté.
        path: ':id',
        loadComponent: () =>
          import('@shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { fonctionnalite: 'Le profil détaillé du mécanicien' },
        title: 'Profil du mécanicien — AutoPro',
      },
    ],
  },
];
