import js from '@eslint/js';
import next from '@next/eslint-plugin-next';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**', 'src/generated/**', 'playwright-report/**', 'storybook-static/**', 'public/**', 'next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { '@next/next': next },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['warn', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        /* `const { dropped: _dropped, ...rest }` is the idiomatic way to omit a
           key; ignoring rest siblings is what makes it legal. */
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      /* The architecture's first rule, as far as a linter can see it: nothing
         in a per-frame path may allocate a new object literal per call. The
         real enforcement is the React-commit-count gate in e2e/. */
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['scripts/**/*.mjs', '*.config.{mjs,ts}'],
    /* Scripts run in Node, but the callbacks they hand to page.evaluate run in
       the browser — both sets of globals are legitimate in these files. */
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: { 'no-console': 'off' },
  },
);
