import { Button, Chip, Col, Flex, Grid, Row } from '../../../src'
import { Block, Section } from '../../shared'

export function LayoutSection() {
  return (
    <Section>
      <Block label="Row — gap + align (no inline flex styles)">
        <Row gap="md">
          <Button>One</Button>
          <Button variant="outlined">Two</Button>
          <Chip>Tag</Chip>
        </Row>
      </Block>

      <Block label="Row — justify=between (toolbar) · grow spacer">
        <Row
          gap="sm"
          padding="sm"
          style={{ border: '1px solid var(--tz-color-border)', borderRadius: 8 }}
        >
          <Chip color="medium">Logo</Chip>
          <Flex grow />
          <Button variant="text" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save</Button>
        </Row>
      </Block>

      <Block label="Row — wrap">
        <Row gap="xs" wrap>
          {Array.from({ length: 12 }).map((_, i) => (
            <Chip key={i} variant="outlined">
              Item {i + 1}
            </Chip>
          ))}
        </Row>
      </Block>

      <Block label="Col — stacked, gap, fixed width">
        <Col gap="sm" style={{ maxWidth: 240 }}>
          <Button fullWidth>First</Button>
          <Button fullWidth variant="outlined">
            Second
          </Button>
          <Button fullWidth variant="text">
            Third
          </Button>
        </Col>
      </Block>

      <Block label="nested · padding accepts token / px / CSS string">
        <Row
          gap="lg"
          padding="md"
          style={{ border: '1px solid var(--tz-color-border)', borderRadius: 8 }}
        >
          <Col gap="xxs">
            <Chip color="success">Active</Chip>
          </Col>
          <Col gap={4}>
            <Button size="sm">A</Button>
            <Button size="sm" variant="outlined">
              B
            </Button>
          </Col>
        </Row>
      </Block>

      <Block label="Grid — fixed cols={3}">
        <Grid cols={3} gap="sm">
          {Array.from({ length: 6 }).map((_, i) => (
            <Button key={i} variant="outlined" fullWidth>
              Cell {i + 1}
            </Button>
          ))}
        </Grid>
      </Block>

      <Block label="Grid — responsive (minItemWidth, auto-fits & wraps)">
        <Grid minItemWidth={140} gap="sm">
          {Array.from({ length: 8 }).map((_, i) => (
            <Chip key={i} variant="outlined">
              Tag {i + 1}
            </Chip>
          ))}
        </Grid>
      </Block>
    </Section>
  )
}
