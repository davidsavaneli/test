import { useState } from 'react'
import { Button, OtpField, Typography } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

export function OtpFieldSection() {
  const [code, setCode] = useState('')
  const [completed, setCompleted] = useState<string | null>(null)

  return (
    <Section>
      {/* the basics — default 4 numeric boxes, onComplete */}
      <Block
        label="Basic (numeric, 4)"
        description="Default — 4 numeric boxes. Type to advance, Backspace to step back, Arrows to navigate, paste to fill. onComplete fires once all boxes are filled."
      >
        <OtpField
          label="Verification Code"
          value={code}
          onChange={setCode}
          onComplete={setCompleted}
        />
        <Typography variant="bodySmall" color="muted" as="div">
          Value: {code || '—'} {completed && `· completed: ${completed}`}
        </Typography>
        <div>
          <Button variant="outlined" size="sm" onClick={() => setCode('')}>
            Clear
          </Button>
        </div>
      </Block>

      {/* length + types */}
      <Block
        label="Length & Type"
        description="length sets the box count; type restricts characters — numeric, alphabetic, or alphanumeric (also picks the mobile keyboard)."
      >
        <OtpField label="6-digit numeric" length={6} type="numeric" defaultValue="12" />
        <div style={{ marginTop: 'var(--tz-space-sm)' }}>
          <OtpField label="5 alphanumeric" length={5} type="alphanumeric" defaultValue="A1b" />
        </div>
        <div style={{ marginTop: 'var(--tz-space-sm)' }}>
          <OtpField label="4 alphabetic" length={4} type="alphabetic" defaultValue="ab" />
        </div>
      </Block>

      {/* sizes */}
      <Block label="Sizes" description="sm · md · lg — the box and character scale together.">
        {SIZES.map((size) => (
          <div key={size} style={{ marginBottom: 'var(--tz-space-md)' }}>
            <Typography variant="caption" color="muted" as="div" style={{ marginBottom: 4 }}>
              {size}
            </Typography>
            <OtpField size={size} defaultValue="12" aria-label={`${size} code`} />
          </div>
        ))}
      </Block>

      {/* colors */}
      <Block
        label="Colors"
        description="color tints the caret + focus ring + active box via the shared --tz-btn-rgb pattern."
      >
        {(['primary', 'medium', 'success', 'warning'] as const).map((color) => (
          <div key={color} style={{ marginBottom: 'var(--tz-space-sm)' }}>
            <OtpField color={color} defaultValue="12" aria-label={`${color} code`} />
          </div>
        ))}
      </Block>

      {/* error + disabled + placeholder */}
      <Block
        label="Error, Disabled & Placeholder"
        description="error reddens the boxes + helper; disabled inerts them; placeholder shows a char in empty boxes."
      >
        <OtpField
          label="Invalid code"
          error
          helperText="That code is incorrect"
          defaultValue="99"
        />
        <div style={{ marginTop: 'var(--tz-space-sm)' }}>
          <OtpField label="Placeholder" placeholder="•" />
        </div>
        <div style={{ marginTop: 'var(--tz-space-sm)' }}>
          <OtpField label="Disabled" disabled defaultValue="1234" />
        </div>
      </Block>
    </Section>
  )
}
