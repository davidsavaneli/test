import { Icon, IconButton } from '../../../src'
import { Block, COLORS, rowStyle, Section, SIZES, VARIANTS } from '../../shared'

export function IconButtonSection() {
  return (
    <Section title="IconButton">
      <Block label="variants × colors">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {VARIANTS.map((v) => (
            <div key={v} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <code style={{ fontSize: 11 }}>{v}</code>
              <div style={rowStyle}>
                {COLORS.map((c) => (
                  <IconButton key={c} variant={v} color={c} aria-label={c}>
                    <Icon name="Setting2" />
                  </IconButton>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block label="sizes">
        <div style={rowStyle}>
          {SIZES.map((s) => (
            <IconButton key={s} size={s} aria-label={`size ${s}`}>
              <Icon name="Add" />
            </IconButton>
          ))}
        </div>
      </Block>

      <Block label="states">
        <div style={rowStyle}>
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
        </div>
        <div style={rowStyle}>
          {SIZES.map((s) => (
            <IconButton key={s} size={s} loading aria-label={`loading ${s}`}>
              <Icon name="Add" />
            </IconButton>
          ))}
        </div>
        <IconButton color="error" nonClickable>
          <Icon name="Add" />
        </IconButton>
      </Block>
    </Section>
  )
}
