import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { API_CONFIG, ApiConfig, DEFAULT_API_CONFIG } from './config/api.config';
import { HttpNearbyMechanicRepository } from './data/nearby-mechanic.repository.http';
import { NearbyMechanicRepository } from './data/nearby-mechanic.repository';
import { HttpVehicleRepository } from './data/vehicle.repository.http';
import { VehicleRepository } from './data/vehicle.repository';
import { apiErrorInterceptor } from './http/api-error.interceptor';
import { authInterceptor } from './http/auth.interceptor';

/**
 * Racine de composition des dépendances transverses.
 *
 * Rassembler ces fournisseurs derrière une fonction unique évite que
 * `app.config.ts` grossisse à chaque nouveau service, et donne un point
 * d'entrée unique pour substituer la configuration en test :
 *
 *   TestBed.configureTestingModule({
 *     providers: [provideCore({ ...DEFAULT_API_CONFIG, gateway: '/mock' })],
 *   });
 *
 * `withFetch()` est requis pour que les requêtes fonctionnent correctement
 * pendant le rendu côté serveur (SSR), déjà activé sur ce projet.
 */
export function provideCore(config: ApiConfig = DEFAULT_API_CONFIG): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: API_CONFIG, useValue: config },
    // `authInterceptor` d'abord : il pose le token et gère le 401 avant que
    // `apiErrorInterceptor` ne transforme l'erreur en `ApiError`.
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, apiErrorInterceptor])),
    // Le parc de véhicules sert au formulaire de signalement et à l'écran
    // « Mes véhicules » : dépôt fourni globalement, pas par route.
    { provide: VehicleRepository, useClass: HttpVehicleRepository },
    // Recherche géospatiale : carte interactive + bandeau de l'accueil.
    { provide: NearbyMechanicRepository, useClass: HttpNearbyMechanicRepository },
  ]);
}
