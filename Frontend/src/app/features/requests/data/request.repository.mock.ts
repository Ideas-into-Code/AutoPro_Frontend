import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, delay, of } from 'rxjs';

import { InterventionRequest } from '../models/request.model';
import { InterventionRequestDraft } from '../models/request-draft.model';
import { RequestRepository } from './request.repository';

/**
 * Estimation tarifaire par type de panne, en francs CFA.
 *
 * C'est normalement le serveur qui l'établit, à partir de la grille du
 * mécanicien et de la distance. Ces montants ne servent qu'à rendre l'accusé
 * de réception crédible en démonstration, et disparaîtront avec le mock.
 */
const ESTIMATIONS_XOF: Readonly<Record<string, number>> = {
  batterie: 15000,
  pneu: 12000,
  panne_moteur: 35000,
  freinage: 25000,
  remorquage: 30000,
  autre: 20000,
};

/** Compteur de session : suffit à distinguer deux demandes d'une démonstration. */
let prochainNumero = 1;

/**
 * Implémentation simulée : accepte la demande et renvoie ce que le serveur
 * renverrait, identifiant et statut compris.
 *
 * Les photos ne sont pas conservées — il n'y a rien pour les stocker — mais
 * elles sont bien reçues, ce qui suffit à valider le parcours de bout en bout.
 */
export class MockRequestRepository extends RequestRepository {
  private readonly platformId = inject(PLATFORM_ID);

  create(draft: InterventionRequestDraft): Observable<InterventionRequest> {
    const maintenant = new Date().toISOString();
    const numero = String(prochainNumero++).padStart(3, '0');

    const enregistree: InterventionRequest = {
      id: `req-2026-${numero}`,
      clientId: 'usr-client-01',
      clientName: 'Mohamed El Fadel Badji',
      clientPhone: draft.contactPhone,
      problemType: draft.problemType,
      description: draft.description,
      // Une demande vient d'être déposée : aucun mécanicien ne l'a encore
      // acceptée, le seul statut honnête est l'attente.
      status: 'en_attente',
      estimatedPriceXOF: ESTIMATIONS_XOF[draft.problemType] ?? ESTIMATIONS_XOF['autre'],
      locationAddress: draft.location.address,
      createdAt: maintenant,
      updatedAt: maintenant,
    };

    const reponse = of(enregistree);

    // Latence côté navigateur seulement : l'envoi est l'endroit où l'utilisateur
    // doit voir un état de chargement, il faut donc pouvoir le vérifier.
    return isPlatformBrowser(this.platformId) ? reponse.pipe(delay(700)) : reponse;
  }
}
