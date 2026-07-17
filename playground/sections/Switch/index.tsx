import { useState } from 'react'
import { Col, Row, Switch } from '../../../src'
import { Block, Section } from '../../shared'

export function SwitchSection() {
  const [on, setOn] = useState(true)

  return (
    <Section>
      <Block label="basic · controlled">
        <Col gap={12}>
          <Switch label="Switch" />
          <Switch label="Notifications" checked={on} onChange={setOn} />
        </Col>
      </Block>

      <Block label="colors (on)">
        <Row gap={24} wrap>
          <Switch color="accent" defaultChecked aria-label="Medium" />
          <Switch color="success" defaultChecked aria-label="Success" />
          <Switch color="error" defaultChecked aria-label="Error" />
          <Switch color="primary" defaultChecked aria-label="Primary" />
          <Switch color="warning" defaultChecked aria-label="Warning" />
        </Row>
      </Block>

      <Block label="sizes">
        <Row gap={24} wrap align="center">
          <Switch size="lg" label="Large" defaultChecked />
          <Switch size="md" label="Medium" defaultChecked />
          <Switch size="sm" label="Small" defaultChecked />
        </Row>
      </Block>

      <Block label="states">
        <Col gap={12}>
          <Switch label="Disabled" disabled />
          <Switch label="Disabled On" disabled defaultChecked />
          <Switch label="Required" required error />
        </Col>
      </Block>
    </Section>
  )
}
