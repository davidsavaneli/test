// Post-build: assemble the single stylesheet and duplicate declaration files for the CJS condition.
// Run after `vite build` + `tsc -p tsconfig.build.json`.
import { cpSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// 1. Ship the standalone reset.
cpSync('src/styles/reset.css', 'dist/reset.css')

// 2. Prepend the design tokens + base styles into the one bundled stylesheet (dist/index.css).
const css = ['src/styles/theme.css', 'src/styles/general.css', 'dist/index.css']
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n')
writeFileSync('dist/index.css', css)

// 3. Duplicate every `.d.ts` as `.d.cts` so the package's CJS ("require") condition resolves
//    CJS-flavored types under `moduleResolution: node16/nodenext` (ESM consumers keep `.d.ts`).
function duplicateDeclarations(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) duplicateDeclarations(path)
    else if (entry.name.endsWith('.d.ts')) cpSync(path, path.replace(/\.d\.ts$/, '.d.cts'))
  }
}
duplicateDeclarations('dist')
