import { Checkbox, Col, Row, Typography } from '../../../src'
import { Block, Section } from '../../shared'

export function CheckboxSection() {
  return (
    <Section>
      <Block label="basic · checked colors">
        <Col gap={12}>
          <Checkbox label="Checkbox" />
          <Row gap={16} wrap>
            <Checkbox color="success" defaultChecked aria-label="Success" />
            <Checkbox color="error" defaultChecked aria-label="Error" />
            <Checkbox color="primary" defaultChecked aria-label="Primary" />
          </Row>
        </Col>
      </Block>

      <Block label="group (vertical / horizontal)">
        <Row gap={48} wrap align="start">
          <Col gap={12}>
            <Typography variant="bodySmall" color="muted">
              Form Label
            </Typography>
            <Checkbox label="Checkbox 1" />
            <Checkbox label="Checkbox 2" />
          </Col>
          <Col gap={12}>
            <Typography variant="bodySmall" color="muted">
              Form Label
            </Typography>
            <Row gap={24} wrap>
              <Checkbox label="Checkbox 1" />
              <Checkbox label="Checkbox 2" />
            </Row>
          </Col>
        </Row>
      </Block>

      <Block label="sizes">
        <Row gap={24} wrap>
          <Checkbox size="lg" label="Large" />
          <Checkbox size="md" label="Medium" />
          <Checkbox size="sm" label="Small" />
        </Row>
      </Block>

      <Block label="states">
        <Col gap={12}>
          <Checkbox label="Disabled" disabled />
          <Checkbox label="Disabled Checked" disabled defaultChecked />
          <Checkbox label="Required" error />
        </Col>
      </Block>
    </Section>
  )
}
