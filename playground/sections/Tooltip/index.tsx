import { Button, Icon, IconButton, Row, Tooltip } from '../../../src'
import { Block, Section } from '../../shared'

const PLACEMENTS = ['top', 'bottom', 'left', 'right'] as const

export function TooltipSection() {
  return (
    <Section>
      <Block label="placements (default top) — hover or focus">
        <Row gap={40} wrap padding="24px 8px">
          {PLACEMENTS.map((p) => (
            <Tooltip key={p} content={`Tooltip on ${p}`} placement={p}>
              <Button variant="outlined">{p}</Button>
            </Tooltip>
          ))}
        </Row>
      </Block>

      <Block label="on an IconButton">
        <Row gap={24} wrap>
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
        </Row>
      </Block>

      <Block label="longer content (wraps, max 240px)">
        <Row gap={24} wrap padding="8px">
          <Tooltip
            content="Tooltips wrap onto multiple lines once they reach their max width, so longer hints stay readable."
            placement="bottom"
          >
            <Button>Long Tooltip</Button>
          </Tooltip>
        </Row>
      </Block>
    </Section>
  )
}
