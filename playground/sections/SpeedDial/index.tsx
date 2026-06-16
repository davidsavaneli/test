import { type CSSProperties, type ReactNode } from 'react'
import {
  Button,
  Row,
  SpeedDial,
  SpeedDialAction,
  type SpeedDialActionItem,
  type SpeedDialDirection,
  useDisclosure,
} from '../../../src'
import { Block, cap, Section } from '../../shared'

const ACTIONS: SpeedDialActionItem[] = [
  { key: 'edit', icon: 'Edit2', label: 'Edit', onClick: () => {} },
  { key: 'copy', icon: 'Copy', label: 'Copy' },
  { key: 'share', icon: 'Send2', label: 'Share' },
  { key: 'print', icon: 'Printer', label: 'Print' },
]

/** Where the FAB sits in its stage so the actions fan out into the box (not over the page). */
const STAGE_ALIGN: Record<SpeedDialDirection, CSSProperties> = {
  up: { alignItems: 'flex-end', justifyContent: 'center' },
  down: { alignItems: 'flex-start', justifyContent: 'center' },
  left: { alignItems: 'center', justifyContent: 'flex-end' },
  right: { alignItems: 'center', justifyContent: 'flex-start' },
}

/** A padded box that gives a dial room to fan out. */
function Stage({ direction, children }: { direction: SpeedDialDirection; children: ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        minHeight: 220,
        minWidth: 200,
        padding: 'var(--tz-space-md)',
        border: '1px dashed var(--tz-color-border)',
        borderRadius: 'var(--tz-radius-md)',
        ...STAGE_ALIGN[direction],
      }}
    >
      {children}
    </div>
  )
}

const DIRECTIONS: SpeedDialDirection[] = ['up', 'down', 'left', 'right']
const COLORS = ['primary', 'success', 'info', 'warning', 'error'] as const

export function SpeedDialSection() {
  const controlled = useDisclosure()

  return (
    <Section>
      <Block
        label="Basic — hover or click the FAB"
        description="The + rotates to × on open; actions fan up with tooltip labels and close on click."
      >
        <Stage direction="up">
          <SpeedDial ariaLabel="Document actions" actions={ACTIONS} />
        </Stage>
      </Block>

      <Block label="Directions — up / down / left / right">
        <Row gap={16} wrap>
          {DIRECTIONS.map((d) => (
            <Stage key={d} direction={d}>
              <SpeedDial ariaLabel={`${cap(d)} actions`} direction={d} actions={ACTIONS} />
            </Stage>
          ))}
        </Row>
      </Block>

      <Block label="Colors — the FAB tint follows the color prop">
        <Row gap={16} wrap>
          {COLORS.map((c) => (
            <Stage key={c} direction="up">
              <SpeedDial ariaLabel={`${cap(c)} actions`} color={c} actions={ACTIONS.slice(0, 3)} />
            </Stage>
          ))}
        </Row>
      </Block>

      <Block
        label="Custom open icon + children"
        description="openIcon swaps the glyph (× here) instead of rotating; actions passed as children."
      >
        <Stage direction="up">
          <SpeedDial ariaLabel="Create" icon="Add" openIcon="CloseSquare" color="dark">
            <SpeedDialAction icon="Edit2" label="New Doc" />
            <SpeedDialAction icon="Share" label="New Folder" />
            <SpeedDialAction icon="Heart" label="New Favorite" />
          </SpeedDial>
        </Stage>
      </Block>

      <Block
        label="Controlled — open state driven from outside (hover disabled)"
        description={`open: ${controlled.isOpen}`}
      >
        <Row gap={16} wrap align="center">
          <Button variant="outlined" onClick={controlled.toggle}>
            {controlled.isOpen ? 'Close' : 'Open'} Dial
          </Button>
          <Stage direction="right">
            <SpeedDial
              ariaLabel="Controlled actions"
              direction="right"
              openOnHover={false}
              open={controlled.isOpen}
              onOpenChange={(o) => (o ? controlled.open() : controlled.close())}
              actions={ACTIONS}
            />
          </Stage>
        </Row>
      </Block>
    </Section>
  )
}
