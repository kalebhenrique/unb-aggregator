import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist', 'src-tauri', 'node_modules', 'src/core/infrastructure/bindings.ts'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/core/**'],
    // Fronteira: fora de src/core, ninguém importa adapters de infraestrutura
    // nem abre internos de core — a API pública é o barrel "@/core".
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/core/infrastructure', '@/core/infrastructure/**', '**/core/infrastructure/**'],
            message: 'Adapters de infraestrutura só são conhecidos dentro de src/core (ver src/core/container.ts).',
          },
          {
            group: ['@/core/domain', '@/core/domain/**', '@/core/application', '@/core/application/**', '**/core/domain/**', '**/core/application/**'],
            message: 'Importe pela API pública: import { ... } from "@/core".',
          },
        ],
      }],
    },
  },
  {
    files: ['src/core/domain/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/*', '@/**'],
            message: 'O domínio não depende de nada fora de src/core/domain.',
          },
        ],
      }],
    },
  },
  {
    files: ['src/core/application/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/*', '@/**', '**/infrastructure/**'],
            message: 'Use cases dependem apenas do domínio (interfaces e entidades).',
          },
        ],
      }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/core/**'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  }
);
