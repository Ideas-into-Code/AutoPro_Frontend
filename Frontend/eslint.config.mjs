// @ts-check
import js from '@eslint/js';
import angular from 'angular-eslint';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

/**
 * Configuration ESLint (format « flat », le seul supporté par ESLint 10).
 *
 * `eslint-config-prettier` est toujours placé en dernier : il neutralise les
 * règles de mise en forme d'ESLint qui entreraient en conflit avec Prettier.
 * Répartition des rôles : Prettier formate, ESLint cherche les erreurs.
 */
export default tseslint.config(
  {
    ignores: ['dist/**', '.angular/**', 'node_modules/**', 'public/**'],
  },

  // --- Fichiers TypeScript ---------------------------------------------------
  {
    files: ['src/**/*.ts'],
    extends: [
      js.configs.recommended,
      // `recommendedTypeChecked` exploite le typage : il détecte les promesses
      // non attendues et les `any` implicites, invisibles pour une analyse
      // purement syntaxique.
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      prettier,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      // Les sélecteurs de composant acceptent les deux formes : `app-card`
      // pour un élément, `appButton` pour un attribut posé sur une balise
      // native (cas du bouton, qui conserve ainsi la sémantique HTML).
      '@angular-eslint/component-selector': [
        'error',
        [
          { type: 'element', prefix: 'app', style: 'kebab-case' },
          { type: 'attribute', prefix: 'app', style: 'camelCase' },
        ],
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],

      // Conventions imposées par CONVENTIONS.md §5.
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',
      '@angular-eslint/no-empty-lifecycle-method': 'error',

      // Un `any` explicite est parfois nécessaire face à une API non typée,
      // mais il doit rester signalé pour être discuté en revue.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],

      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
    },
  },

  // --- Règle de dépendance de l'architecture ---------------------------------
  // Traduit en erreur de lint la règle « features -> shared -> core » de
  // CONVENTIONS.md §1, qui resterait sinon une simple recommandation.
  {
    files: ['src/app/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@features/*', '**/features/**', '@shared/*', '**/shared/**'],
              message:
                "core/ ne doit dependre ni de shared/ ni d'une feature : les dependances vont vers l'interieur (features -> shared -> core).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@features/*', '**/features/**'],
              message:
                "shared/ doit rester reutilisable : il ne peut pas dependre d'une feature. Deplacez le code partage dans shared/ ou core/.",
            },
          ],
        },
      ],
    },
  },

  // --- Point d'entrée serveur ------------------------------------------------
  {
    files: ['src/server.ts'],
    rules: {
      // Journaliser le démarrage du serveur sur la sortie standard est l'usage
      // attendu : c'est ce que lisent les journaux d'hébergement.
      'no-console': 'off',
    },
  },

  // --- Fichiers de test ------------------------------------------------------
  {
    files: ['src/**/*.spec.ts'],
    rules: {
      // Les assertions de test manipulent volontiers des objets partiels.
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  // --- Gabarits HTML ---------------------------------------------------------
  {
    files: ['src/**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      // L'accessibilité est non négociable (CONVENTIONS.md §6) : ces règles
      // detectent les images sans alternative, les clics sans equivalent
      // clavier et les libelles manquants.
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
    },
  },
);
