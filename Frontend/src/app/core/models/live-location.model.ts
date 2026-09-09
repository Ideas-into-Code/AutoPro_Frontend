/**
 * Position d'un mécanicien diffusée en temps réel pendant une intervention.
 *
 * Émise par le mécanicien sur `/app/tracking.update`, rediffusée par le backend
 * sur `/topic/tracking/{mechanicId}`.
 */
export interface LiveLocation {
  readonly mechanicId: string;
  readonly latitude: number;
  readonly longitude: number;

  /** Cap en degrés (0 = nord), si l'appareil le fournit. */
  readonly heading: number | null;

  /** Horodatage ISO du relevé, tel que renvoyé par le backend. */
  readonly at: string;
}
