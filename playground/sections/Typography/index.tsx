import { Typography } from '../../../src'
import { Block, cap, COLORS, rowStyle, Section } from '../../shared'

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TYPO_VARIANTS.map((v) => (
            <div key={v} style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <code style={{ fontSize: 11, width: 80, flexShrink: 0 }}>{v}</code>
              <Typography variant={v}>The quick brown fox</Typography>
            </div>
          ))}
        </div>
      </Block>

      <Block label="colors">
        <div style={rowStyle}>
          <Typography>Text (default)</Typography>
          {COLORS.map((c) => (
            <Typography key={c} color={c}>
              {cap(c)}
            </Typography>
          ))}
        </div>
      </Block>

      <Block label="align">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            width: '100%',
          }}
        >
          <Typography align="left">Left Aligned</Typography>
          <Typography align="center">Center Aligned</Typography>
          <Typography align="right">Right Aligned</Typography>
        </div>
      </Block>

      <Block label="modifiers">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxWidth: 280,
          }}
        >
          <Typography truncate>
            Truncate — this is a very long single line that will be clipped with an ellipsis
          </Typography>
          <Typography as="span" variant="h3">
            as=&quot;span&quot; (h3 styling, span tag)
          </Typography>
        </div>
      </Block>
    </Section>
  )
}
