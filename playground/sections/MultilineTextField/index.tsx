import { useState } from 'react'
import { Col, MultilineTextField } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

export function MultilineTextFieldSection() {
  const [bio, setBio] = useState('')

  return (
    <Section>
      <Block label="basic — auto-grows as you type">
        <Col gap={16} style={{ maxWidth: 360 }}>
          <MultilineTextField label="Bio" placeholder="Tell us about yourself…" fullWidth />
          <MultilineTextField
            label="Notes"
            defaultValue={'Line one\nLine two\nLine three\nLine four'}
            fullWidth
          />
          <MultilineTextField label="Disabled" placeholder="Can't type here" disabled fullWidth />
        </Col>
      </Block>

      <Block label="minRows / maxRows (grows from 2, scrolls past 6)">
        <Col gap={16} style={{ maxWidth: 360 }}>
          <MultilineTextField
            label="Message"
            minRows={2}
            maxRows={6}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Type a few lines…"
            helperText="Starts at 2 rows, grows to 6, then scrolls"
            fullWidth
          />
        </Col>
      </Block>

      <Block label="sizes">
        <Col gap={16} style={{ maxWidth: 360 }}>
          {SIZES.map((s) => (
            <MultilineTextField
              key={s}
              size={s}
              label={`Size ${s.toUpperCase()}`}
              placeholder={s}
              fullWidth
            />
          ))}
        </Col>
      </Block>

      <Block label="error state">
        <Col gap={16} style={{ maxWidth: 360 }}>
          <MultilineTextField label="Bio" required error helperText="Required" fullWidth />
        </Col>
      </Block>
    </Section>
  )
}
