import { useState } from 'react'
import { Col, RichTextEditor, Typography } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

const SAMPLE = `<h2>Welcome to the editor</h2><p>This is a <strong>rich text</strong> editor built on <em>Lexical</em>. Try <u>formatting</u>, lists, links and media.</p><ul><li>Bullet one</li><li>Bullet two</li></ul><blockquote>A block quote.</blockquote>`

export function RichTextEditorSection() {
  const [html, setHtml] = useState(SAMPLE)

  return (
    <Section>
      <Block
        label="basic · uncontrolled (defaultValue)"
        description="Full toolbar: undo/redo, formatting, block-type dropdown (headings/quote/lists), link, image (upload → base64 or by URL), video (URL embed). Markdown shortcuts work while typing: '# ', '- ', '> '."
      >
        <RichTextEditor
          defaultValue={SAMPLE}
          placeholder="Start writing…"
          aria-label="Demo editor"
        />
      </Block>

      <Block
        label="controlled · HTML value out"
        description="value + onChange(html). The serialized HTML is shown below the editor."
      >
        <Col gap={12}>
          <RichTextEditor value={html} onChange={setHtml} aria-label="Controlled editor" />
          <Typography variant="caption" color="muted">
            HTML output ({html.length} chars)
          </Typography>
          <pre
            style={{
              margin: 0,
              padding: 'var(--tz-space-sm)',
              background: 'var(--tz-color-primary-shade100)',
              borderRadius: 'var(--tz-radius-sm)',
              fontSize: 'var(--tz-font-size-sm)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'var(--tz-color-text)',
            }}
          >
            {html}
          </pre>
        </Col>
      </Block>

      <Block label="sizes" description="sm / md / lg — toolbar density + content font size.">
        <Col gap={16}>
          {SIZES.map((s) => (
            <RichTextEditor
              key={s}
              size={s}
              minHeight={120}
              defaultValue={`<p>Size <strong>${s}</strong></p>`}
              aria-label={`Size ${s}`}
            />
          ))}
        </Col>
      </Block>

      <Block
        label="states"
        description="label + required + helper, error, and disabled (read-only)."
      >
        <Col gap={16}>
          <RichTextEditor
            label="With label"
            required
            helperText="Helper text under the editor"
            minHeight={120}
            defaultValue="<p>Labeled editor.</p>"
          />
          <RichTextEditor
            label="Error"
            error
            helperText="Something needs fixing"
            minHeight={120}
            defaultValue="<p>Invalid content.</p>"
          />
          <RichTextEditor
            label="Disabled (read-only)"
            disabled
            minHeight={120}
            defaultValue="<p>You can read but not edit this.</p>"
          />
        </Col>
      </Block>
    </Section>
  )
}
