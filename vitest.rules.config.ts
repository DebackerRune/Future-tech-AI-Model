import { defineConfig } from 'vitest/config'

// Firestore security rules tests. Run with `npm run test:rules` (starts the Firestore emulator).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
})
