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

/* The dial positions ITSELF — `position: absolute` pinned to a corner of a relative parent (or
   `fixed` to the viewport for a page FAB). The Panel below is just that relative parent (your page /
   card / section); the dial doesn't need any special wrapper. The corner is chosen per direction so
   the actions fan into the parent. */
const DIAL_POS: Record<SpeedDialDirection, CSSProperties> = {
  up: { position: 'absolute', right: 16, bottom: 16 },
  down: { position: 'absolute', right: 16, top: 16 },
  left: { position: 'absolute', right: 16, bottom: 16 },
  right: { position: 'absolute', left: 16, bottom: 16 },
}

/** A relative positioning context (stands in for your page/card) so the absolute dial has an anchor. */
function Panel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        height: 230,
        minWidth: 230,
        flex: '1 1 230px',
        border: '1px dashed var(--tz-color-border)',
        borderRadius: 'var(--tz-radius-md)',
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
        description="Position the dial yourself: position: absolute in a relative parent (the dashed panel here), or position: fixed for a page FAB. The + rotates to × on open; actions fan up and close on click."
      >
        <Panel>
          <SpeedDial ariaLabel="Document actions" actions={ACTIONS} style={DIAL_POS.up} />
        </Panel>
      </Block>

      <Block
        label="Persistent labels — tooltipOpen"
        description="Every action's label shows as soon as the dial opens, no hover needed."
      >
        <Panel>
          <SpeedDial
            ariaLabel="Labelled actions"
            actions={ACTIONS}
            tooltipOpen
            style={DIAL_POS.up}
          />
        </Panel>
      </Block>

      <Block label="Directions — up / down / left / right">
        <Row gap={16} wrap>
          {DIRECTIONS.map((d) => (
            <Panel key={d}>
              <SpeedDial
                ariaLabel={`${cap(d)} actions`}
                direction={d}
                actions={ACTIONS}
                style={DIAL_POS[d]}
              />
            </Panel>
          ))}
        </Row>
      </Block>

      <Block label="Colors — the FAB tint follows the color prop">
        <Row gap={16} wrap>
          {COLORS.map((c) => (
            <Panel key={c}>
              <SpeedDial
                ariaLabel={`${cap(c)} actions`}
                color={c}
                actions={ACTIONS.slice(0, 3)}
                style={DIAL_POS.up}
              />
            </Panel>
          ))}
        </Row>
      </Block>

      <Block
        label="Custom open icon + children"
        description="openIcon swaps the glyph (× here) instead of rotating; actions passed as children."
      >
        <Panel>
          <SpeedDial
            ariaLabel="Create"
            icon="Add"
            openIcon="CloseSquare"
            color="brand"
            style={DIAL_POS.up}
          >
            <SpeedDialAction icon="Edit2" label="New Doc" />
            <SpeedDialAction icon="Share" label="New Folder" />
            <SpeedDialAction icon="Heart" label="New Favorite" />
          </SpeedDial>
        </Panel>
      </Block>

      <Block
        label="Controlled — open state driven from outside (hover disabled)"
        description={`open: ${controlled.isOpen}`}
      >
        <Row gap={16} wrap align="center">
          <Button variant="outlined" onClick={controlled.toggle}>
            {controlled.isOpen ? 'Close' : 'Open'} Dial
          </Button>
          <Panel>
            <SpeedDial
              ariaLabel="Controlled actions"
              direction="right"
              openOnHover={false}
              open={controlled.isOpen}
              onOpenChange={(o) => (o ? controlled.open() : controlled.close())}
              actions={ACTIONS}
              style={DIAL_POS.right}
            />
          </Panel>
        </Row>
      </Block>
    </Section>
  )
}
