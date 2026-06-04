import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    cssCodeSplit: false,
    sourcemap: true,
    rollupOptions: {
      external: [
        'clsx',
        /^react($|\/)/,
        /^react-dom($|\/)/,
        /^zod($|\/)/,
        /^@tanstack\/react-router($|\/)/,
      ],
      output: {
        assetFileNames: (info) => {
          const name = info.name ?? info.names?.[0] ?? ''
          return name.endsWith('.css') ? 'index.css' : '[name][extname]'
        },
      },
    },
  },
})
