import type { CSSProperties } from 'react'
import { Checkbox, Typography } from '../../../src'
import { Block, Section } from '../../shared'

export function CheckboxSection() {
  const col: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 }
  return (
    <Section>
      <Block label="basic · checked colors">
        <div style={col}>
          <Checkbox label="Checkbox" />
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Checkbox color="success" defaultChecked aria-label="Success" />
            <Checkbox color="error" defaultChecked aria-label="Error" />
            <Checkbox color="primary" defaultChecked aria-label="Primary" />
          </div>
        </div>
      </Block>

      <Block label="group (vertical / horizontal)">
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
          <div style={col}>
            <Typography variant="bodySmall" color="tertiary">
              Form Label
            </Typography>
            <Checkbox label="Checkbox 1" />
            <Checkbox label="Checkbox 2" />
          </div>
          <div style={col}>
            <Typography variant="bodySmall" color="tertiary">
              Form Label
            </Typography>
            <div style={{ display: 'flex', gap: 24 }}>
              <Checkbox label="Checkbox 1" />
              <Checkbox label="Checkbox 2" />
            </div>
          </div>
        </div>
      </Block>

      <Block label="sizes">
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Checkbox size="lg" label="Large" />
          <Checkbox size="md" label="Medium" />
          <Checkbox size="sm" label="Small" />
        </div>
      </Block>

      <Block label="states">
        <div style={col}>
          <Checkbox label="Disabled" disabled />
          <Checkbox label="Disabled Checked" disabled defaultChecked />
          <Checkbox label="Required" error />
        </div>
      </Block>
    </Section>
  )
}
