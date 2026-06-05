import { Button, Icon, IconButton, Tooltip } from '../../../src'
import { Block, rowStyle, Section } from '../../shared'

const PLACEMENTS = ['top', 'bottom', 'left', 'right'] as const

export function TooltipSection() {
  return (
    <Section>
      <Block label="placements (default top) — hover or focus">
        <div style={{ ...rowStyle, gap: 40, padding: '24px 8px' }}>
          {PLACEMENTS.map((p) => (
            <Tooltip key={p} content={`Tooltip on ${p}`} placement={p}>
              <Button variant="outlined">{p}</Button>
            </Tooltip>
          ))}
        </div>
      </Block>

      <Block label="on an IconButton">
        <div style={{ ...rowStyle, gap: 24 }}>
          <Tooltip content="Edit">
            <IconButton variant="filled" aria-label="Edit">
              <Icon name="Edit2" />
            </IconButton>
          </Tooltip>
          <Tooltip content="Delete" placement="bottom">
            <IconButton variant="filled" color="error" aria-label="Delete">
              <Icon name="Trash" />
            </IconButton>
          </Tooltip>
          <Tooltip content="Settings" placement="right">
            <IconButton variant="outlined" aria-label="Settings">
              <Icon name="Setting2" />
            </IconButton>
          </Tooltip>
        </div>
      </Block>

      <Block label="longer content (wraps, max 240px)">
        <div style={{ ...rowStyle, gap: 24, padding: '8px' }}>
          <Tooltip
            content="Tooltips wrap onto multiple lines once they reach their max width, so longer hints stay readable."
            placement="bottom"
          >
            <Button>Long Tooltip</Button>
          </Tooltip>
        </div>
      </Block>
    </Section>
  )
}
