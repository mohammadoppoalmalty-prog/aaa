import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': resolve(__dirname, 'src'), '@content': resolve(__dirname, 'content') } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
