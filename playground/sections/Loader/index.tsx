import { Flex, Loader, Row } from '../../../src'
import { Block, COLORS, Section, SIZES } from '../../shared'

export function LoaderSection() {
  return (
    <Section>
      <Block label="sizes">
        <Row gap={28} wrap>
          {SIZES.map((s) => (
            <Loader key={s} size={s} />
          ))}
        </Row>
      </Block>

      <Block label="colors">
        <Row gap={28} wrap>
          {COLORS.map((c) => (
            <Loader key={c} color={c} size="lg" />
          ))}
        </Row>
      </Block>

      <Block label="inherits text color (currentColor)">
        <Row gap={12} wrap>
          {(['primary', 'success', 'error', 'warning', 'info'] as const).map((c) => (
            <Flex
              key={c}
              align="center"
              justify="center"
              style={{
                width: 56,
                height: 56,
                borderRadius: 8,
                backgroundColor: `var(--tz-color-${c})`,
                color: '#fff',
              }}
            >
              <Loader size="lg" />
            </Flex>
          ))}
        </Row>
      </Block>
    </Section>
  )
}
