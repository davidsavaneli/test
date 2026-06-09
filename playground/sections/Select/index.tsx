import { useState } from 'react'
import { Col, Select, type SelectOption } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

const FRUITS: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'grape', label: 'Grape' },
  { value: 'mango', label: 'Mango', disabled: true },
  { value: 'orange', label: 'Orange' },
]

const STATUSES: SelectOption[] = [
  { value: 'active', label: 'Active', icon: 'TickCircle' },
  { value: 'pending', label: 'Pending', icon: 'Clock' },
  { value: 'blocked', label: 'Blocked', icon: 'CloseCircle' },
]

const COUNTRIES: SelectOption[] = [
  'Georgia',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'United Kingdom',
  'United States',
  'Canada',
  'Japan',
  'Brazil',
  'Australia',
  'India',
].map((c) => ({ value: c.toLowerCase().replace(/\s+/g, '-'), label: c }))

export function SelectSection() {
  const [fruit, setFruit] = useState('banana')

  return (
    <Section>
      <Block label="basic · controlled">
        <Col gap={16} style={{ maxWidth: 320 }}>
          <Select label="Fruit" options={FRUITS} value={fruit} onChange={setFruit} />
        </Col>
      </Block>

      <Block label="with icons">
        <Col gap={16} style={{ maxWidth: 320 }}>
          <Select label="Status" options={STATUSES} defaultValue="active" />
        </Col>
      </Block>

      <Block label="searchable · clearable (long list)">
        <Col gap={16} style={{ maxWidth: 320 }}>
          <Select
            label="Country"
            options={COUNTRIES}
            searchable
            clearable
            placeholder="Select a country…"
          />
        </Col>
      </Block>

      <Block label="sizes">
        <Col gap={16} style={{ maxWidth: 320 }}>
          {SIZES.map((s) => (
            <Select
              key={s}
              size={s}
              label={`Size ${s.toUpperCase()}`}
              options={FRUITS}
              defaultValue="apple"
            />
          ))}
        </Col>
      </Block>

      <Block label="states">
        <Col gap={16} style={{ maxWidth: 320 }}>
          <Select label="Empty (placeholder)" options={FRUITS} placeholder="Choose…" />
          <Select label="Disabled" options={FRUITS} defaultValue="apple" disabled />
          <Select
            label="With error"
            options={FRUITS}
            required
            error
            helperText="Please select a fruit"
          />
        </Col>
      </Block>
    </Section>
  )
}
