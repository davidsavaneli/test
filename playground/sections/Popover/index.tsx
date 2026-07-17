import {
  Badge,
  Button,
  Col,
  Divider,
  Icon,
  IconButton,
  Popover,
  Row,
  Typography,
  useDisclosure,
} from '../../../src'
import { Block, Section } from '../../shared'

/** The filter popover from the screenshot — a header/body/footer panel anchored to a badge'd FAB. */
function FilterPopover() {
  const filter = useDisclosure()
  return (
    <Popover
      open={filter.isOpen}
      onOpenChange={(open) => (open ? filter.open() : filter.close())}
      align="end"
      trapFocus
      width={420}
      ariaLabel="Filter"
      trigger={
        <Badge content={2}>
          <IconButton variant="filled" aria-label="Filter">
            <Icon name="Filter" />
          </IconButton>
        </Badge>
      }
    >
      {/* header — tinted icon box + title (like Card/Modal), then a solid divider */}
      <Row align="center" gap="sm" padding="var(--tz-space-sm) var(--tz-space-md)">
        <IconButton variant="filled" color="accent" size="sm" nonClickable aria-hidden>
          <Icon name="Filter" />
        </IconButton>
        <Typography variant="h4" as="h4">
          Filter
        </Typography>
      </Row>
      <Divider />

      {/* body */}
      <div style={{ padding: 'var(--tz-space-md)' }}>
        <Typography>Content Here …</Typography>
      </div>

      {/* dashed divider + footer (Clear left · Close / Filter right) */}
      <div style={{ borderTop: '1px dashed var(--tz-color-border)' }} />
      <Row justify="between" align="center" padding="var(--tz-space-sm) var(--tz-space-md)">
        <Button variant="outlined" startIcon={<Icon name="Trash" />} onClick={filter.close}>
          Clear
        </Button>
        <Row gap="xs">
          <Button variant="text" onClick={filter.close}>
            Close
          </Button>
          <Button startIcon={<Icon name="Filter" />} onClick={filter.close}>
            Filter
          </Button>
        </Row>
      </Row>
    </Popover>
  )
}

export function PopoverSection() {
  return (
    <Section>
      <Block
        label="Filter popover — anchored panel with a header / body / footer"
        description="A Popover holds arbitrary content (here a filter form). The badge'd IconButton is the trigger; the panel opens below it, traps focus, and closes on the footer buttons, outside click, or Escape."
      >
        <Row gap={24} wrap style={{ justifyContent: 'flex-end' }}>
          <FilterPopover />
        </Row>
      </Block>

      <Block
        label="Simple — any content, opens below the trigger"
        description="Uncontrolled; closes on outside-pointerdown or Escape (which refocuses the trigger)."
      >
        <Popover ariaLabel="Quick info" trigger={<Button variant="outlined">Details</Button>}>
          <Col gap={8} style={{ padding: 'var(--tz-space-md)', maxWidth: 260 }}>
            <Typography variant="h4" as="h3">
              Heads up
            </Typography>
            <Typography variant="bodySmall" color="muted">
              A Popover is the generic anchored surface — drop any content in. Unlike Dropdown it
              isn't a menu, so forms and rich layouts belong here.
            </Typography>
          </Col>
        </Popover>
      </Block>

      <Block
        label="Match trigger width"
        description="matchTriggerWidth makes the panel at least as wide as the trigger (select-like)."
      >
        <Popover
          matchTriggerWidth
          ariaLabel="Wide panel"
          trigger={
            <Button fullWidth style={{ maxWidth: 280 }}>
              Open a panel as wide as me
            </Button>
          }
        >
          <div style={{ padding: 'var(--tz-space-md)' }}>
            <Typography>The panel matches the trigger's width.</Typography>
          </div>
        </Popover>
      </Block>
    </Section>
  )
}
