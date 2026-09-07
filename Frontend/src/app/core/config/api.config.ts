import { InjectionToken } from '@angular/core';

/**
 * Domaines métier d'AutoPro, un par microservice du backend.
 * Ajouter un service ici est la seule modification nécessaire pour qu'un
 * nouveau dépôt puisse l'adresser (principe ouvert/fermé).
 */
export type MicroserviceName =
  | 'auth'
  | 'users'
  | 'mechanics'
  | 'requests'
  | 'pricing'
  | 'reviews'
  | 'messaging'
  | 'geolocation'
  | 'payments'
  | 'admin';

/**
 * Contrat de configuration des services distants. Les composants et dépôts
 * dépendent de cette abstraction, jamais d'une URL écrite en dur
 * (principe d'inversion des dépendances).
 */
export interface ApiConfig {
  /** Racine commune, typiquement la passerelle d'API. */
  readonly gateway: string;
  /** Préfixe de route propre à chaque microservice. */
  readonly services: Readonly<Record<MicroserviceName, string>>;
  /** Délai maximal d'une requête, en millisecondes. */
  readonly timeoutMs: number;
}

/**
 * Jeton d'injection de la configuration d'API.
 * Permet de fournir une configuration différente en test ou par environnement
 * sans toucher au code des dépôts.
 */
export const API_CONFIG = new InjectionToken<ApiConfig>('AutoPro.ApiConfig');

/**
 * Configuration par défaut. Les chemins sont relatifs : c'est la passerelle
 * qui route vers le bon microservice, ce qui évite au frontend de connaître
 * la topologie du backend.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  gateway: '/api',
  // Le backend est un monolithe : chaque « service » correspond en fait à un
  // préfixe de route Spring, pas à un microservice distinct.
  services: {
    auth: 'auth',
    users: 'users',
    mechanics: 'mechanics',
    requests: 'service-requests',
    pricing: 'pricing',
    reviews: 'reviews',
    messaging: 'chat',
    geolocation: 'mechanics',
    payments: 'service-requests',
    admin: 'admin',
  },
  // Volontairement généreux : le réseau mobile sénégalais peut être instable
  // et une coupure prématurée est plus pénalisante qu'une attente.
  timeoutMs: 20_000,
};

/**
 * Construit l'URL d'une ressource d'un microservice.
 * Fonction pure, donc testable sans conteneur d'injection.
 */
export function buildServiceUrl(config: ApiConfig, service: MicroserviceName, path = ''): string {
  const segments = [config.gateway, config.services[service], path]
    .filter((segment) => segment !== '')
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''));

  return `/${segments.join('/')}`;
}
