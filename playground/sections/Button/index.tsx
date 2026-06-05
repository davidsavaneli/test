import { Button, Icon } from '../../../src'
import { Block, cap, COLORS, rowStyle, Section, SIZES, VARIANTS } from '../../shared'

export function ButtonSection() {
  return (
    <Section title="Button">
      <Block label="variants × colors">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {VARIANTS.map((v) => (
            <div key={v} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <code style={{ fontSize: 11 }}>{v}</code>
              <div style={rowStyle}>
                {COLORS.map((c) => (
                  <Button key={c} variant={v} color={c}>
                    {cap(c)}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block label="sizes">
        <div style={rowStyle}>
          {SIZES.map((s) => (
            <Button key={s} size={s}>
              Size {s.toUpperCase()}
            </Button>
          ))}
        </div>
      </Block>

      <Block label="with icons">
        <div style={rowStyle}>
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
        </div>
      </Block>

      <Block label="states">
        <div style={rowStyle}>
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
        </div>
        <div style={rowStyle}>
          {SIZES.map((s) => (
            <Button key={s} size={s} loading startIcon={<Icon name="Add" />}>
              Loading {s.toUpperCase()}
            </Button>
          ))}
        </div>
        <Button fullWidth>Full Width</Button>
      </Block>
    </Section>
  )
}
