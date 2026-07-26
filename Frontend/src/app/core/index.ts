/**
 * Briques transverses de l'application : configuration, accès aux données,
 * gestion des erreurs. Tout ce qui est instancié une seule fois pour toute
 * l'application vit ici.
 */

export { API_CONFIG, DEFAULT_API_CONFIG, buildServiceUrl } from './config/api.config';
export type { ApiConfig, MicroserviceName } from './config/api.config';

export { HttpRepository } from './data/http-repository.base';
export type {
  CrudRepository,
  DeleteRepository,
  ReadRepository,
  WriteRepository,
} from './data/repository';

export { toApiError } from './http/api-error';
export type { ApiError, ApiErrorKind } from './http/api-error';
export { apiErrorInterceptor } from './http/api-error.interceptor';

export { DEFAULT_PAGE_SIZE, FIRST_PAGE, emptyPage } from './models/pagination';
export type { Page, PageRequest } from './models/pagination';

export { provideCore } from './core.providers';
