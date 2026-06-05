import { Col, Row, Typography } from '../../../src'
import { Block, cap, COLORS, Section } from '../../shared'

const TYPO_VARIANTS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'subtitle',
  'body',
  'bodySmall',
  'caption',
  'uppercase',
] as const

export function TypographySection() {
  return (
    <Section>
      <Block label="variants">
        <Col gap={10}>
          {TYPO_VARIANTS.map((v) => (
            <Row key={v} align="baseline" gap={16}>
              <code style={{ fontSize: 11, width: 80, flexShrink: 0 }}>{v}</code>
              <Typography variant={v}>The quick brown fox</Typography>
            </Row>
          ))}
        </Col>
      </Block>

      <Block label="colors">
        <Row gap={12} wrap>
          <Typography>Text (default)</Typography>
          {COLORS.map((c) => (
            <Typography key={c} color={c}>
              {cap(c)}
            </Typography>
          ))}
        </Row>
      </Block>

      <Block label="align">
        <Col gap={8} style={{ width: '100%' }}>
          <Typography align="left">Left Aligned</Typography>
          <Typography align="center">Center Aligned</Typography>
          <Typography align="right">Right Aligned</Typography>
        </Col>
      </Block>

      <Block label="modifiers">
        <Col gap={12} style={{ maxWidth: 280 }}>
          <Typography truncate>
            Truncate — this is a very long single line that will be clipped with an ellipsis
          </Typography>
          <Typography as="span" variant="h3">
            as=&quot;span&quot; (h3 styling, span tag)
          </Typography>
        </Col>
      </Block>
    </Section>
  )
}
