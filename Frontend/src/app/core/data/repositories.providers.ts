import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { ServiceCategoryRepository } from './service-category.repository';
import { HttpServiceCategoryRepository } from './service-category.repository.http';
import { MockServiceCategoryRepository } from './service-category.repository.mock';

/**
 * ============================================================================
 * POINT DE BASCULE DONNÉES SIMULÉES → BACKEND
 * ============================================================================
 *
 * Le backend n'existe pas encore. Les écrans doivent malgré tout être
 * développés et démontrables, d'où des dépôts qui renvoient des données
 * fabriquées.
 *
 * Le jour où l'API est en ligne, la migration se résume à **une ligne dans
 * `app.config.ts`** :
 *
 *   provideMockRepositories()   →   provideHttpRepositories()
 *
 * Aucun composant, aucun écran, aucun test d'écran n'est touché : tous
 * dépendent de la classe abstraite `ServiceCategoryRepository`, jamais d'une
 * implémentation. C'est tout l'intérêt d'avoir inversé la dépendance.
 *
 * Les deux implémentations honorent le même contrat et sont donc
 * interchangeables sans que l'appelant ait à s'en apercevoir
 * (principe de substitution de Liskov).
 *
 * Migration progressive possible : rien n'oblige à tout basculer d'un coup.
 * Un domaine dont l'API est prête peut passer en HTTP pendant que les autres
 * restent simulés — il suffit de composer les deux fonctions.
 */

/** Dépôts servant des données fabriquées. À remplacer, pas à faire évoluer. */
export function provideMockRepositories(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ServiceCategoryRepository, useClass: MockServiceCategoryRepository },
  ]);
}

/** Dépôts adressant réellement la passerelle d'API. */
export function provideHttpRepositories(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ServiceCategoryRepository, useClass: HttpServiceCategoryRepository },
  ]);
}
