import { useState } from 'react'
import { ColorPicker, Col } from '../../../src'
import { Block, Section } from '../../shared'

export function ColorPickerSection() {
  const [color, setColor] = useState('#039aa1')

  return (
    <Section>
      <Block label="basic · controlled">
        <Col gap={16} style={{ maxWidth: 320 }}>
          <ColorPicker label="Brand color" value={color} onChange={setColor} />
        </Col>
      </Block>

      <Block label="opacity · rgb / rgba">
        <Col gap={16} style={{ maxWidth: 320 }}>
          {/* drag the alpha slider or type an rgb()/rgba() value — the value comes back as rgba() */}
          <ColorPicker label="With opacity" defaultValue="rgba(124, 58, 237, 0.5)" />
          <ColorPicker label="From rgb()" defaultValue="rgb(3, 154, 161)" />
        </Col>
      </Block>

      <Block label="sizes">
        <Col gap={16} style={{ maxWidth: 320 }}>
          <ColorPicker label="Large" size="lg" defaultValue="#7c3aed" />
          <ColorPicker label="Medium" size="md" defaultValue="#0ea5e9" />
          <ColorPicker label="Small" size="sm" defaultValue="#00a854" />
        </Col>
      </Block>

      <Block label="states · custom swatches">
        <Col gap={16} style={{ maxWidth: 320 }}>
          <ColorPicker label="Empty (placeholder)" placeholder="Pick a color" />
          <ColorPicker label="Disabled" disabled defaultValue="#f04134" />
          <ColorPicker label="With error" required error helperText="Pick a color" />
          <ColorPicker
            label="Custom swatches"
            defaultValue="#e11d48"
            swatches={['#e11d48', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6']}
          />
        </Col>
      </Block>
    </Section>
  )
}
