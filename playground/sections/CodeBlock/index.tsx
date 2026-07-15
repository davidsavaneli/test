import { CodeBlock } from '../../../src'
import { Block, Section } from '../../shared'

const TSX = `import { Button } from '@techzy/ui'

export function SaveBar({ onSave }: { onSave: () => void }) {
  return (
    <div className="bar">
      <Button color="success" onClick={onSave}>
        Save Changes
      </Button>
    </div>
  )
}`

const JSON_SNIPPET = `{
  "id": 42,
  "title": "Wireless Keyboard",
  "price": 129.99,
  "inStock": true,
  "tags": ["electronics", "accessories"]
}`

const BASH = `npm i @techzy/ui shiki
npm run dev`

const LONG = Array.from(
  { length: 30 },
  (_, i) => `console.log('line ${i + 1} of a long file that should scroll inside the block')`,
).join('\n')

export function CodeBlockSection() {
  return (
    <Section>
      {/* the basics — VS Code colors, copy button */}
      <Block
        label="Basic (TSX)"
        description="Shiki highlighting with VS Code's own dark-plus theme — the block stays dark in both app modes. The copy button turns into a tick."
      >
        <CodeBlock code={TSX} language="tsx" />
      </Block>

      {/* other languages */}
      <Block
        label="JSON & Bash"
        description="Any Shiki language id — json, bash, css, sql, yaml, …"
      >
        <CodeBlock code={JSON_SNIPPET} language="json" />
        <div style={{ marginTop: 'var(--tz-space-sm)' }}>
          <CodeBlock code={BASH} language="bash" />
        </div>
      </Block>

      {/* title header + line numbers */}
      <Block
        label="Title & Line Numbers"
        description="title adds a filename header bar (the copy button moves into it); showLineNumbers adds a muted gutter."
      >
        <CodeBlock code={TSX} language="tsx" title="SaveBar.tsx" showLineNumbers />
      </Block>

      {/* maxHeight + wrap */}
      <Block
        label="Max Height & Wrap"
        description="maxHeight caps the block (the code scrolls inside); wrap soft-wraps long lines instead of horizontal scrolling."
      >
        <CodeBlock code={LONG} language="ts" title="long-file.ts" maxHeight={220} wrap />
      </Block>
    </Section>
  )
}
