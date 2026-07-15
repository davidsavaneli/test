import { existsSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const root = dirname(fileURLToPath(import.meta.url))
const src = resolve(root, 'src')
const componentsDir = resolve(src, 'components')

// One build entry per component folder → enables `sava-test/components/<Name>` subpath imports.
// Emit into the component's own directory (`dist/components/<Name>/index.js`) — never a flat
// `dist/components/<Name>.js` — so the runtime file can't shadow the `<Name>/index.d.ts` types
// during the barrel's `export *` resolution under `moduleResolution: bundler`.
const componentEntries = Object.fromEntries(
  readdirSync(componentsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(resolve(componentsDir, d.name, 'index.ts')))
    .map((d) => [`components/${d.name}/index`, resolve(componentsDir, d.name, 'index.ts')]),
)

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  build: {
    lib: {
      entry: {
        index: resolve(src, 'index.ts'),
        // Curated subpath surfaces (mapped via package.json "exports").
        'entries/components': resolve(src, 'entries/components.ts'),
        'entries/hooks': resolve(src, 'entries/hooks.ts'),
        'entries/theme': resolve(src, 'entries/theme.ts'),
        'entries/icons': resolve(src, 'entries/icons.ts'),
        'entries/helpers': resolve(src, 'entries/helpers.ts'),
        ...componentEntries,
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    cssCodeSplit: false,
    sourcemap: true,
    rollupOptions: {
      // Peer/optional deps are never bundled — the consumer provides them.
      external: [
        'clsx',
        /^react($|\/)/,
        /^react-dom($|\/)/,
        /^react-dropzone($|\/)/,
        // bare module only — externalize the JS but let `react-image-crop/dist/ReactCrop.css` bundle in
        /^react-image-crop$/,
        /^zod($|\/)/,
        /^dayjs($|\/)/,
        /^@tanstack\/react-router($|\/)/,
        /^@tanstack\/react-table($|\/)/,
        /^@dnd-kit\/[^/]+($|\/)/,
        /^@formkit\/auto-animate($|\/)/,
        /^lexical($|\/)/,
        /^@lexical\/[^/]+($|\/)/,
        /^shiki($|\/)/,
      ],
      output: {
        // Components expose both a named and a default export — force named CJS interop so the
        // default lands on `.default` predictably (silences Rollup's mixed-exports warning).
        exports: 'named',
        assetFileNames: (info) => {
          const name = info.name ?? info.names?.[0] ?? ''
          return name.endsWith('.css') ? 'index.css' : '[name][extname]'
        },
      },
    },
  },
})
