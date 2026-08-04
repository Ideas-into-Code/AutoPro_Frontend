import { FormControl } from '@angular/forms';

import { telephoneSenegalaisValidator } from './telephone.validator';

/**
 * Aucun TestBed, aucun conteneur d'injection : le validateur est une fonction
 * pure, c'est précisément l'intérêt de l'avoir écrit ainsi.
 */
describe('telephoneSenegalaisValidator', () => {
  const valide = (valeur: string): boolean =>
    telephoneSenegalaisValidator(new FormControl(valeur)) === null;

  it('accepte les préfixes mobiles en service', () => {
    for (const numero of ['770000000', '750000000', '760000000', '780000000', '700000000']) {
      expect(valide(numero)).toBe(true);
    }
  });

  it("accepte les séparateurs et l'indicatif pays", () => {
    for (const numero of ['77 123 45 67', '77-123-45-67', '+221771234567', '221 77 123 45 67']) {
      expect(valide(numero)).toBe(true);
    }
  });

  it('refuse un fixe, un numéro trop court ou trop long', () => {
    for (const numero of ['331234567', '7712345', '7712345678']) {
      expect(valide(numero)).toBe(false);
    }
  });

  it('refuse un préfixe mobile inexistant', () => {
    expect(valide('710000000')).toBe(false);
  });

  it('laisse passer un champ vide, qui relève de Validators.required', () => {
    expect(valide('')).toBe(true);
    expect(valide('   ')).toBe(true);
  });
});
