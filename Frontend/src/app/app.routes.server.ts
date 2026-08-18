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
    // Tout le reste est statique : prérendu au build, donc servi sans calcul
    // et affiché dès la première requête, même sur un réseau lent.
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
