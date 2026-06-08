import { useState } from 'react'
import { Col, Radio, RadioGroup, Row } from '../../../src'
import { Block, Section } from '../../shared'

const PLANS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'team', label: 'Team' },
]

const ONE_TWO = [
  { value: '1', label: 'One' },
  { value: '2', label: 'Two' },
]

export function RadioSection() {
  const [plan, setPlan] = useState('pro')

  return (
    <Section>
      <Block label="RadioGroup (vertical) · controlled">
        <RadioGroup label="Plan" name="plan" options={PLANS} value={plan} onChange={setPlan} />
      </Block>

      <Block label="horizontal · colors">
        <Col gap={16}>
          <RadioGroup
            label="Contact method"
            orientation="horizontal"
            defaultValue="email"
            options={[
              { value: 'email', label: 'Email' },
              { value: 'sms', label: 'SMS' },
              { value: 'push', label: 'Push' },
            ]}
          />
          <RadioGroup
            label="Success color"
            orientation="horizontal"
            color="success"
            defaultValue="a"
            options={[
              { value: 'a', label: 'Option A' },
              { value: 'b', label: 'Option B' },
            ]}
          />
        </Col>
      </Block>

      <Block label="sizes">
        <Row gap={48} wrap align="start">
          <RadioGroup label="Large" size="lg" defaultValue="1" options={ONE_TWO} />
          <RadioGroup label="Medium" size="md" defaultValue="1" options={ONE_TWO} />
          <RadioGroup label="Small" size="sm" defaultValue="1" options={ONE_TWO} />
        </Row>
      </Block>

      <Block label="children API · states · error">
        <Row gap={48} wrap align="start">
          <RadioGroup label="Children API" defaultValue="x">
            <Radio value="x" label="Explicit child X" />
            <Radio value="y" label="Explicit child Y" />
            <Radio value="z" label="Disabled child" disabled />
          </RadioGroup>
          <RadioGroup
            label="Disabled group"
            disabled
            defaultValue="a"
            options={[
              { value: 'a', label: 'A' },
              { value: 'b', label: 'B' },
            ]}
          />
          <RadioGroup
            label="With error"
            required
            error
            options={[
              { value: 'a', label: 'A' },
              { value: 'b', label: 'B' },
            ]}
          />
        </Row>
      </Block>
    </Section>
  )
}
