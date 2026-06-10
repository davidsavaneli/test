import { defineConfig } from 'vitest/config'

// Pin the suite to UTC so date/time tests are deterministic on any machine (the date components show
// the viewer's *local* time, so without this an assertion like "09:35" would shift by the dev's offset).
process.env.TZ = 'UTC'

export default defineConfig({
  // Match the library's JSX transform (the build config uses esbuild's automatic runtime).
  esbuild: { jsx: 'automatic' },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // CSS isn't processed in jsdom; return the original class names so we can assert on them
    // (e.g. `styles.contained` -> "contained"). We test behavior/markup, not computed styles.
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
})
