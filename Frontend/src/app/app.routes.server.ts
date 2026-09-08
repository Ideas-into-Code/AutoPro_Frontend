import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Mode de rendu serveur, route par route.
 *
 * L'ordre compte : la première entrée qui correspond l'emporte, donc les
 * chemins précis viennent avant le joker.
 */
export const serverRoutes: ServerRoute[] = [
  {
    /**
     * Le profil d'un mécanicien dépend d'un identifiant : impossible de le
     * prérendre sans connaître à l'avance la liste complète des mécaniciens,
     * qui vivra en base de données. Il est donc rendu à la demande.
     *
     * L'alternative — un `getPrerenderParams` — supposerait d'interroger le
     * backend au moment du build et de reconstruire le site à chaque nouveau
     * mécanicien inscrit.
     */
    path: 'mecaniciens/:id',
    renderMode: RenderMode.Server,
  },
  {
    /**
     * La liste des mécaniciens vient de l'API : rendue à la demande plutôt que
     * prérendue au build, où le backend n'est pas joignable.
     */
    path: 'mecaniciens',
    renderMode: RenderMode.Server,
  },
  {
    /**
     * L'espace « Mes demandes » dépend de l'utilisateur connecté (session en
     * `localStorage`, appels API authentifiés) : rien à prérendre au build,
     * tout est rendu à la demande.
     */
    path: 'demandes',
    renderMode: RenderMode.Server,
  },
  {
    path: 'demandes/signaler',
    renderMode: RenderMode.Server,
  },
  {
    path: 'demandes/:id',
    renderMode: RenderMode.Server,
  },
  {
    // Parc de véhicules : données de l'utilisateur connecté, via l'API.
    path: 'vehicules',
    renderMode: RenderMode.Server,
  },
  {
    // Messagerie : conversations du compte connecté + WebSocket (navigateur).
    path: 'messages',
    renderMode: RenderMode.Server,
  },
  {
    /**
     * Tout l'espace mécanicien dépend du compte connecté et de l'API :
     * rendu à la demande.
     */
    path: 'mecanicien',
    renderMode: RenderMode.Server,
  },
  {
    path: 'mecanicien/**',
    renderMode: RenderMode.Server,
  },
  {
    // Back-office : indicateurs, comptes et file de validation, tous tirés de
    // l'API sous session administrateur. Rendu à la demande.
    path: 'admin',
    renderMode: RenderMode.Server,
  },
  {
    path: 'admin/**',
    renderMode: RenderMode.Server,
  },
  {
    // Tout le reste est statique : prérendu au build, donc servi sans calcul
    // et affiché dès la première requête, même sur un réseau lent.
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
