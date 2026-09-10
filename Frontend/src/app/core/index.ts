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

export { provideHttpRepositories, provideMockRepositories } from './data/repositories.providers';
export { ServiceCategoryRepository } from './data/service-category.repository';

export { VehicleRepository } from './data/vehicle.repository';
export { vehicleLabel } from './models/vehicle.model';
export type { Vehicle, VehicleDraft } from './models/vehicle.model';

export { NearbyMechanicRepository } from './data/nearby-mechanic.repository';
export type { NearbyMechanic, NearbyMechanicQuery } from './models/nearby-mechanic.model';

export { toApiError } from './http/api-error';
export type { ApiError, ApiErrorKind } from './http/api-error';
export { apiErrorInterceptor } from './http/api-error.interceptor';

export { DEFAULT_PAGE_SIZE, FIRST_PAGE, emptyPage } from './models/pagination';
export type { Page, PageRequest } from './models/pagination';
export type { ServiceCategory } from './models/service-category';

export {
  BrowserPositionProvider,
  PositionError,
  PositionProvider,
} from './services/position.provider';
export type { Position, PositionErrorKind } from './services/position.provider';

export { RealtimeSocketService } from './services/realtime-socket.service';
export { MechanicTrackingService, haversineKm } from './services/mechanic-tracking.service';
export type { BroadcastHandle } from './services/mechanic-tracking.service';
export { RoutingService } from './services/routing.service';
export type { RoadRoute } from './services/routing.service';
export { MechanicPresenceService } from './services/mechanic-presence.service';
export { ImageUploadService } from './services/image-upload.service';
export type { LiveLocation } from './models/live-location.model';

export { provideCore } from './core.providers';
