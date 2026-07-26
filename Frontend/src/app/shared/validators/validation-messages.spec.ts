import { firstValidationMessage } from './validation-messages';

describe('firstValidationMessage', () => {
  it("ne renvoie rien quand le contrôle n'a pas d'erreur", () => {
    expect(firstValidationMessage(null)).toBeNull();
  });

  it('traduit les erreurs courantes en français', () => {
    expect(firstValidationMessage({ required: true })).toContain('obligatoire');
    expect(firstValidationMessage({ email: true })).toContain('e-mail');
    expect(firstValidationMessage({ telephoneSenegalais: true })).toContain('sénégalais');
  });

  it('intègre la longueur attendue dans le message', () => {
    expect(firstValidationMessage({ minlength: { requiredLength: 8, actualLength: 3 } })).toContain(
      '8',
    );
  });

  it('reste générique si le détail de longueur est absent', () => {
    expect(firstValidationMessage({ minlength: {} })).toBe('Valeur trop courte.');
  });

  it("n'affiche jamais une clé technique pour un validateur inconnu", () => {
    const message = firstValidationMessage({ validateurMaison: true });

    expect(message).toBe('Cette valeur est invalide.');
    expect(message).not.toContain('validateurMaison');
  });
});
