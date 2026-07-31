import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, MicroserviceName, buildServiceUrl } from '@core';
import { InterventionRequest } from '../models/request.model';
import { InterventionRequestDraft } from '../models/request-draft.model';
import { RequestRepository } from './request.repository';

const SERVICE: MicroserviceName = 'requests';
const RESOURCE = 'interventions';

/**
 * Implémentation réelle, à fournir en lieu et place de la version simulée
 * lorsque le microservice « requests » sera en ligne — une ligne à changer
 * dans `requests.routes.ts`.
 *
 * N'hérite pas de `HttpRepository` : cette base sert la lecture paginée
 * (`findAll`, `findById`), dont ce dépôt n'a pas l'usage. En hériter
 * apporterait deux méthodes inutilisées et une pagination sans objet.
 */
export class HttpRequestRepository extends RequestRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  create(draft: InterventionRequestDraft): Observable<InterventionRequest> {
    return this.http.post<InterventionRequest>(
      buildServiceUrl(this.config, SERVICE, RESOURCE),
      toFormData(draft),
    );
  }
}

/**
 * Assemble la charge utile en `multipart/form-data`.
 *
 * Obligatoire dès qu'il y a des fichiers : du JSON imposerait de convertir
 * chaque photo en base64, ce qui l'alourdit d'un tiers. Sur un forfait mobile
 * sénégalais, envoyer 4 Mo au lieu de 3 pour la même photo n'est pas neutre.
 *
 * Aucun en-tête `Content-Type` n'est posé à la main : le navigateur doit
 * l'écrire lui-même pour y inclure la frontière (`boundary`) qu'il génère.
 * Le forcer casserait l'analyse côté serveur.
 */
function toFormData(draft: InterventionRequestDraft): FormData {
  const corps = new FormData();

  corps.set('problemType', draft.problemType);
  corps.set('description', draft.description);
  corps.set('contactPhone', draft.contactPhone);
  corps.set('isEmergency', String(draft.isEmergency));
  corps.set('locationAddress', draft.location.address);

  const coordonnees = draft.location.coordinates;

  if (coordonnees !== undefined) {
    corps.set('latitude', String(coordonnees.latitude));
    corps.set('longitude', String(coordonnees.longitude));
  }

  // Même clé répétée plutôt que `photos[0]`, `photos[1]` : c'est la convention
  // que comprennent nativement les serveurs pour une collection de fichiers.
  for (const photo of draft.photos) {
    corps.append('photos', photo, photo.name);
  }

  return corps;
}
