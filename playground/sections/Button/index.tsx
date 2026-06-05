import { Button, Col, Icon, Row } from '../../../src'
import { Block, cap, COLORS, Section, SIZES, VARIANTS } from '../../shared'

export function ButtonSection() {
  return (
    <Section>
      <Block label="variants × colors">
        <Col gap={14}>
          {VARIANTS.map((v) => (
            <Col key={v} gap={6}>
              <code style={{ fontSize: 11 }}>{v}</code>
              <Row gap={12} wrap>
                {COLORS.map((c) => (
                  <Button key={c} variant={v} color={c}>
                    {cap(c)}
                  </Button>
                ))}
              </Row>
            </Col>
          ))}
        </Col>
      </Block>

      <Block label="sizes">
        <Row gap={12} wrap>
          {SIZES.map((s) => (
            <Button key={s} size={s}>
              Size {s.toUpperCase()}
            </Button>
          ))}
        </Row>
      </Block>

      <Block label="with icons">
        <Row gap={12} wrap>
          <Button startIcon={<Icon name="Add" />}>Start Icon</Button>
          <Button endIcon={<Icon name="ArrowRight2" />}>End Icon</Button>
          <Button startIcon={<Icon name="Setting2" />} endIcon={<Icon name="ArrowRight2" />}>
            Both
          </Button>
          <Button variant="outlined" color="error" startIcon={<Icon name="Trash" />}>
            Delete
          </Button>
          <Button variant="filled" color="success" startIcon={<Icon name="TickCircle" />}>
            Save
          </Button>
        </Row>
      </Block>

      <Block label="states">
        <Row gap={12} wrap>
          <Button loading>Loading</Button>
          <Button loading startIcon={<Icon name="Add" />}>
            Loading + Start Icon
          </Button>
          <Button loading endIcon={<Icon name="ArrowRight2" />}>
            Loading + End Icon
          </Button>
          <Button disabled>Disabled</Button>
          <Button variant="outlined" disabled>
            Disabled
          </Button>
          <Button rounded>Rounded</Button>
          <Button variant="filled" color="success" rounded>
            Rounded
          </Button>
        </Row>
        <Row gap={12} wrap>
          {SIZES.map((s) => (
            <Button key={s} size={s} loading startIcon={<Icon name="Add" />}>
              Loading {s.toUpperCase()}
            </Button>
          ))}
        </Row>
        <Button fullWidth>Full Width</Button>
      </Block>
    </Section>
  )
}
