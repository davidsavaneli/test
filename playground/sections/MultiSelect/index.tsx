import { useState } from 'react'
import { Col, MultiSelect, type SelectOption } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

const SKILLS: SelectOption[] = [
  { value: 'react', label: 'React' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'node', label: 'Node.js' },
  { value: 'css', label: 'CSS' },
  { value: 'go', label: 'Go', disabled: true },
  { value: 'rust', label: 'Rust' },
]

const COUNTRIES: SelectOption[] = [
  'Georgia',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'United Kingdom',
  'United States',
  'Japan',
  'Brazil',
  'India',
].map((c) => ({ value: c.toLowerCase().replace(/\s+/g, '-'), label: c }))

export function MultiSelectSection() {
  const [skills, setSkills] = useState<string[]>(['react', 'ts'])

  return (
    <Section>
      <Block label="basic · controlled (toggles, stays open)">
        <Col gap={16} style={{ maxWidth: 360 }}>
          <MultiSelect label="Skills" options={SKILLS} value={skills} onChange={setSkills} />
        </Col>
      </Block>

      <Block label="searchable · clearable (long list)">
        <Col gap={16} style={{ maxWidth: 360 }}>
          <MultiSelect
            label="Countries"
            options={COUNTRIES}
            searchable
            clearable
            color="info"
            placeholder="Select countries…"
          />
        </Col>
      </Block>

      <Block label="sizes">
        <Col gap={16} style={{ maxWidth: 360 }}>
          {SIZES.map((s) => (
            <MultiSelect
              key={s}
              size={s}
              label={`Size ${s.toUpperCase()}`}
              options={SKILLS}
              defaultValue={['react', 'css']}
            />
          ))}
        </Col>
      </Block>

      <Block label="states">
        <Col gap={16} style={{ maxWidth: 360 }}>
          <MultiSelect label="Empty (placeholder)" options={SKILLS} placeholder="Choose skills…" />
          <MultiSelect label="Disabled" options={SKILLS} defaultValue={['react']} disabled />
          <MultiSelect
            label="With error"
            options={SKILLS}
            required
            error
            helperText="Pick at least one skill"
          />
        </Col>
      </Block>
    </Section>
  )
}
