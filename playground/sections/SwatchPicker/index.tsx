import { useState } from 'react'
import { SwatchPicker, Typography } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

const PALETTE = [
  '#056472',
  '#7c3aed',
  '#2563eb',
  '#0891b2',
  '#059669',
  '#ca8a04',
  '#ea580c',
  '#dc2626',
  '#db2777',
]

export function SwatchPickerSection() {
  const [color, setColor] = useState('#7c3aed')

  return (
    <Section>
      {/* controlled — the selected swatch gets a ring + check */}
      <Block
        label="Basic (controlled)"
        description="A grid of preset color swatches — click to pick one. The selected swatch shows a TickCircle icon. value + onChange drive it here."
      >
        <SwatchPicker
          colors={PALETTE}
          value={color}
          onChange={setColor}
          aria-label="Accent color"
        />
        <Typography
          variant="bodySmall"
          color="muted"
          as="div"
          style={{ marginTop: 'var(--tz-space-sm)' }}
        >
          Selected: {color}
        </Typography>
      </Block>

      {/* uncontrolled — owns its own selection */}
      <Block
        label="Uncontrolled (defaultValue)"
        description="No value — the picker owns its selection, seeded from defaultValue."
      >
        <SwatchPicker colors={PALETTE} defaultValue={PALETTE[0]} aria-label="Accent color" />
      </Block>

      {/* sizes */}
      <Block label="Sizes" description="sm · md · lg — the swatch diameter (32 / 44 / 56px).">
        {SIZES.map((size) => (
          <div key={size} style={{ marginBottom: 'var(--tz-space-md)' }}>
            <Typography variant="caption" color="muted" as="div" style={{ marginBottom: 4 }}>
              {size}
            </Typography>
            <SwatchPicker
              colors={PALETTE.slice(0, 5)}
              defaultValue={PALETTE[0]}
              size={size}
              aria-label={`${size} swatches`}
            />
          </div>
        ))}
      </Block>

      {/* per-color labels */}
      <Block
        label="Accessible labels"
        description="Pass `labels` for per-swatch accessible names (e.g. mark the first as a named default) — falls back to the color value."
      >
        <SwatchPicker
          colors={PALETTE}
          defaultValue={PALETTE[0]}
          labels={{ [PALETTE[0]]: 'Default (teal)' }}
          aria-label="Accent color"
        />
      </Block>
    </Section>
  )
}
