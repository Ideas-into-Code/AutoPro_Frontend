/**
 * Véhicule du parc d'un client. Type transverse : le domaine « demandes »
 * comme l'écran de gestion « Mes véhicules » s'en servent, il vit donc dans
 * `core` (CONVENTIONS.md §1 : ce qui est partagé remonte).
 */
export interface Vehicle {
  readonly id: string;
  readonly brand: string;
  readonly model: string;
  readonly year: number;
  readonly licensePlate: string;
  readonly vin: string | null;
  readonly color: string | null;
  readonly mileage: number | null;
  readonly createdAt: string;
}

/** Champs saisis par l'utilisateur pour créer ou modifier un véhicule. */
export interface VehicleDraft {
  readonly brand: string;
  readonly model: string;
  readonly year: number;
  readonly licensePlate: string;
  readonly vin?: string;
  readonly color?: string;
  readonly mileage?: number;
}

/** Libellé court d'un véhicule (« Toyota Corolla · DK4521AB »). */
export function vehicleLabel(v: Vehicle): string {
  return `${v.brand} ${v.model} · ${v.licensePlate}`;
}
