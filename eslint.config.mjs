//@ts-check

import eslint from '@eslint/js'
import nodePlugin from 'eslint-plugin-n'
import prettier from 'eslint-plugin-prettier/recommended'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  nodePlugin.configs['flat/recommended-module'],
  {
    ignores: [
      '**/dist/**',
      'eslint.config.mjs',
      'src/graphql/generated/types.generated.ts',
      'src/graphql/generated/validation.generated.ts',
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        project: ['tsconfig.src.json', 'tsconfig.tests.json'],
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
      },
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-redundant-type-constituents': ['off'],
      '@typescript-eslint/no-unsafe-assignment': ['off'],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ['tests/**/*.test.ts'],
    rules: {
      'n/no-missing-import': 'off',
    },
  },
  prettier,
)
