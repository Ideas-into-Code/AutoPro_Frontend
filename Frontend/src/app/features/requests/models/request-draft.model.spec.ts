import { PROBLEM_TYPE_LABELS, problemTypeFromCategorySlug } from './request-draft.model';

describe('problemTypeFromCategorySlug', () => {
  it('convertit les tirets des slugs en underscores des types de panne', () => {
    // Le piège du ticket : `panne-moteur` côté catégories, `panne_moteur` côté
    // demandes. Une correspondance directe aurait silencieusement donné `autre`.
    expect(problemTypeFromCategorySlug('panne-moteur')).toBe('panne_moteur');
  });

  it('conserve les catégories dont le nom coïncide déjà', () => {
    expect(problemTypeFromCategorySlug('batterie')).toBe('batterie');
    expect(problemTypeFromCategorySlug('pneu')).toBe('pneu');
    expect(problemTypeFromCategorySlug('freinage')).toBe('freinage');
    expect(problemTypeFromCategorySlug('remorquage')).toBe('remorquage');
  });

  it('retombe sur « autre » pour une catégorie sans type de panne déclaré', () => {
    expect(problemTypeFromCategorySlug('climatisation')).toBe('autre');
    expect(problemTypeFromCategorySlug('electricite')).toBe('autre');
  });

  it('retombe sur « autre » quand aucune catégorie ne précède le formulaire', () => {
    expect(problemTypeFromCategorySlug(undefined)).toBe('autre');
    expect(problemTypeFromCategorySlug('')).toBe('autre');
  });

  it("n'invente rien pour une catégorie inconnue", () => {
    expect(problemTypeFromCategorySlug('categorie-ajoutee-plus-tard')).toBe('autre');
  });

  it('propose un intitulé pour chaque type de panne', () => {
    for (const type of ['batterie', 'pneu', 'panne_moteur', 'freinage', 'remorquage', 'autre']) {
      expect(PROBLEM_TYPE_LABELS[type as keyof typeof PROBLEM_TYPE_LABELS]).toBeTruthy();
    }
  });
});
