import { useState, type CSSProperties } from 'react'
import { NumberField } from '../../../src'
import { Block, Section } from '../../shared'

export function NumberFieldSection() {
  const [qty, setQty] = useState<number | null>(2)
  const colStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    maxWidth: 360,
  }

  return (
    <Section>
      <Block label="default value · min / max / step · controlled · disabled">
        <div style={colStyle}>
          <NumberField label="Label" placeholder="0" fullWidth />
          <NumberField label="Quantity" defaultValue={1} min={0} max={10} fullWidth />
          <NumberField label="Price (step 0.5)" defaultValue={9.5} step={0.5} min={0} fullWidth />
          <NumberField
            label="Amount (live grouped)"
            defaultValue={32345345}
            thousandSeparator="."
            max={999999999}
            helperText="Groups live as you type — e.g. 32.345.345"
            fullWidth
          />
          <NumberField
            label="Controlled"
            value={qty}
            onChange={setQty}
            min={0}
            max={5}
            helperText={`Value: ${qty ?? '—'}`}
            fullWidth
          />
          <NumberField label="Disabled" defaultValue={42} disabled fullWidth />
        </div>
      </Block>
    </Section>
  )
}
