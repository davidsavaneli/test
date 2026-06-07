import { Col, Divider, Row, Typography } from '../../../src'
import { Block, Section } from '../../shared'

export function DividerSection() {
  return (
    <Section>
      <Block label="plain">
        <Col gap={12}>
          <Typography color="muted">Above the line</Typography>
          <Divider />
          <Typography color="muted">Below the line</Typography>
        </Col>
      </Block>

      <Block label="with title — align left / center / right">
        <Col gap={24}>
          <Divider align="left">Left</Divider>
          <Divider>Center (default)</Divider>
          <Divider align="right">Right</Divider>
        </Col>
      </Block>

      <Block label="vertical (between items)">
        <Row gap={16} style={{ height: 24 }}>
          <Typography>Profile</Typography>
          <Divider orientation="vertical" />
          <Typography>Settings</Typography>
          <Divider orientation="vertical" />
          <Typography>Logout</Typography>
        </Row>
      </Block>
    </Section>
  )
}
