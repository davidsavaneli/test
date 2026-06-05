import { Loader } from '../../../src'
import { Block, COLORS, rowStyle, Section, SIZES } from '../../shared'

export function LoaderSection() {
  return (
    <Section>
      <Block label="sizes">
        <div style={{ ...rowStyle, gap: 28 }}>
          {SIZES.map((s) => (
            <Loader key={s} size={s} />
          ))}
        </div>
      </Block>

      <Block label="colors">
        <div style={{ ...rowStyle, gap: 28 }}>
          {COLORS.map((c) => (
            <Loader key={c} color={c} size="lg" />
          ))}
        </div>
      </Block>

      <Block label="inherits text color (currentColor)">
        <div style={rowStyle}>
          {(['primary', 'success', 'error', 'warning', 'info'] as const).map((c) => (
            <div
              key={c}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 8,
                backgroundColor: `var(--tz-color-${c})`,
                color: '#fff',
              }}
            >
              <Loader size="lg" />
            </div>
          ))}
        </div>
      </Block>
    </Section>
  )
}
