import { abregerNombre, separerMilliers } from './format-number';

describe('separerMilliers', () => {
  it('sépare les milliers', () => {
    expect(separerMilliers(145500)).toBe('145 500');
  });

  it('utilise une espace ordinaire et non une espace insécable', () => {
    // C'est tout l'objet de la fonction : `toLocaleString` renvoie selon le
    // moteur une insécable, une insécable étroite ou une fine, trois
    // caractères invisibles qu'aucune comparaison écrite au clavier ne trouve.
    expect(separerMilliers(145500)).toContain(' ');
    expect(separerMilliers(145500)).not.toMatch(/[\u00A0\u202F\u2009]/);
  });

  it('laisse les petits nombres intacts', () => {
    expect(separerMilliers(842)).toBe('842');
  });
});

describe('abregerNombre', () => {
  it('abrège les millions avec une décimale', () => {
    expect(abregerNombre(8400000)).toBe('8,4 M');
  });

  it("n'ajoute pas de décimale inutile", () => {
    expect(abregerNombre(12000000)).toBe('12 M');
  });

  it("n'abrège pas en dessous du million", () => {
    // « 0,8 M » ferait perdre l'information exacte sans rien gagner en place.
    expect(abregerNombre(842000)).toBe('842 000');
  });

  it('abrège aussi les valeurs négatives', () => {
    expect(abregerNombre(-2500000)).toBe('-2,5 M');
  });
});
