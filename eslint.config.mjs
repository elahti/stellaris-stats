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
      'workspaces/shared/src/generated/types.generated.ts',
      'workspaces/shared/src/generated/validation.ts',
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        project: ['workspaces/*/tsconfig*.json'],
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
      'n/no-missing-import': [
        'error',
        {
          allowModules: ['@modelcontextprotocol/sdk'],
        },
      ],
    },
  },
  prettier,
)
