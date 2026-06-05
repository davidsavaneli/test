import { Col, Icon, IconButton, Row } from '../../../src'
import { Block, COLORS, Section, SIZES, VARIANTS } from '../../shared'

export function IconButtonSection() {
  return (
    <Section>
      <Block label="variants × colors">
        <Col gap={14}>
          {VARIANTS.map((v) => (
            <Col key={v} gap={6}>
              <code style={{ fontSize: 11 }}>{v}</code>
              <Row gap={12} wrap>
                {COLORS.map((c) => (
                  <IconButton key={c} variant={v} color={c} aria-label={c}>
                    <Icon name="Setting2" />
                  </IconButton>
                ))}
              </Row>
            </Col>
          ))}
        </Col>
      </Block>

      <Block label="sizes">
        <Row gap={12} wrap>
          {SIZES.map((s) => (
            <IconButton key={s} size={s} aria-label={`size ${s}`}>
              <Icon name="Add" />
            </IconButton>
          ))}
        </Row>
      </Block>

      <Block label="states">
        <Row gap={12} wrap>
          <IconButton loading aria-label="loading">
            <Icon name="Add" />
          </IconButton>
          <IconButton disabled aria-label="disabled">
            <Icon name="Add" />
          </IconButton>
          <IconButton variant="outlined" disabled aria-label="disabled">
            <Icon name="Add" />
          </IconButton>
          <IconButton rounded aria-label="rounded">
            <Icon name="Add" />
          </IconButton>
          <IconButton variant="filled" color="error" rounded aria-label="delete">
            <Icon name="Trash" />
          </IconButton>
        </Row>
        <Row gap={12} wrap>
          {SIZES.map((s) => (
            <IconButton key={s} size={s} loading aria-label={`loading ${s}`}>
              <Icon name="Add" />
            </IconButton>
          ))}
        </Row>
        <IconButton color="error" nonClickable>
          <Icon name="Add" />
        </IconButton>
      </Block>
    </Section>
  )
}
