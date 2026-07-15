import { Chip, Timeline, TimelineItem, Typography, type TimelineEntry } from '../../../src'
import { Block, Section } from '../../shared'

const ORDER: TimelineEntry[] = [
  {
    label: 'Product Shipped',
    time: '13th May 2026',
    icon: 'Truck',
    content: (
      <Typography as="span">
        We shipped your product via <strong>FedEx</strong> — it should arrive within 3–5 business
        days.
      </Typography>
    ),
  },
  { label: 'Order Confirmed', time: '18th May 2026', icon: 'TickCircle', color: 'success' },
  { label: 'Order Delivered', time: '20th May 2026, 10:30am', icon: 'Box' },
]

const ACTIVITY: TimelineEntry[] = [
  { label: 'Nino created the project', time: '2 hours ago' },
  { label: 'Dato uploaded 3 files', time: 'Yesterday' },
  { label: 'Ana changed the deadline', time: '2 days ago' },
  { label: 'Giorgi archived the board', time: 'Last week' },
]

const SEMANTIC: TimelineEntry[] = [
  { label: 'Deploy succeeded', time: '14:02', icon: 'TickCircle', color: 'success' },
  { label: 'High memory warning', time: '13:47', icon: 'Warning', color: 'warning' },
  { label: 'Build failed', time: '13:30', icon: 'CloseCircle', color: 'error' },
  { label: 'Pipeline started', time: '13:28', icon: 'Flash', color: 'info' },
]

export function TimelineSection() {
  return (
    <Section>
      {/* the classic — icons + content */}
      <Block
        label="Order Tracking"
        description="Data-driven items — each entry: label, a muted time caption, an optional content body, an icon (a soft tinted circle) and a per-item color (the Confirmed step is success-green)."
      >
        <Timeline items={ORDER} aria-label="Order history" />
      </Block>

      {/* dots — the compact activity-log look */}
      <Block
        label="Activity Log (dots)"
        description="An entry with no icon renders a small dot instead of the circle — the compact feed look. Mix dot and icon entries freely."
      >
        <Timeline items={ACTIVITY} aria-label="Recent activity" />
      </Block>

      {/* per-item semantic colors */}
      <Block
        label="Semantic Colors"
        description="A per-item color tints that node only — success / warning / error / info read at a glance."
      >
        <Timeline items={SEMANTIC} aria-label="Pipeline events" />
      </Block>

      {/* sizes */}
      <Block
        label="Sizes"
        description="sm · md · lg — the node circle, dot, and type scale together."
      >
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <div key={size} style={{ marginBottom: 'var(--tz-space-md)' }}>
            <Typography variant="caption" color="muted" as="div" style={{ marginBottom: 4 }}>
              {size}
            </Typography>
            <Timeline size={size} items={ORDER.slice(0, 2)} aria-label={`${size} timeline`} />
          </div>
        ))}
      </Block>

      {/* children composition — rich bodies */}
      <Block
        label="Composed (children)"
        description="Compose <TimelineItem> children instead of items — the body takes any node (chips, buttons, whatever)."
      >
        <Timeline aria-label="Release history">
          <TimelineItem label="v2.1.0 Released" time="Today" icon="Flash" color="success">
            <Chip color="success">stable</Chip>
          </TimelineItem>
          <TimelineItem label="v2.1.0-rc.1" time="3 days ago" icon="Data">
            <Chip color="warning">release candidate</Chip>
          </TimelineItem>
          <TimelineItem label="Branch cut" time="Last week" />
        </Timeline>
      </Block>
    </Section>
  )
}
