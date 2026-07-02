import { Chip, Table, type TableColumn, type ThemeColor } from '../../../src'
import { Block, Section } from '../../shared'

/* Column widths / wrapping — cells are single-line by default (the table scrolls). Opt a long-text column
   into wrapping with `wrap` (caps at a readable 280px), or `maxWidth` for a different cap. Here: support
   tickets with a short ref + subject (single-line) and two long free-text columns (wrapped). */

interface Ticket {
  id: string
  ref: string
  subject: string
  priority: 'Low' | 'Normal' | 'High'
  summary: string
  resolution: string
}

const PRIORITIES: Ticket['priority'][] = ['Low', 'Normal', 'High']
const SUBJECTS = [
  'Login fails intermittently',
  'Payment declined at checkout',
  'Export produces an empty file',
  'Slow dashboard on mobile',
  'Webhook retries never stop',
  '2FA code not delivered',
  'Timezone off by one hour',
  'Avatar upload rejected',
]
const SUMMARIES = [
  'User reports the sign-in button spins and then returns to the form without any error message, but only on the first attempt after the tab has been idle for a while.',
  'Cards are declined with a generic gateway error even though the same card works in the mobile app; suspected mismatch in the billing-address normalisation step.',
  'The CSV export downloads instantly but contains only the header row; the background job log shows the query timing out after thirty seconds on large accounts.',
]
const RESOLUTIONS = [
  'Root-caused to an expired session token that the client cached past its TTL; patched the refresh logic to re-request before the first call and added a regression test. Rolling out behind a flag this week and monitoring the retry metrics before a full release.',
  'Awaiting more information from the reporter — asked for a HAR capture and the exact timestamp so we can correlate with the gateway logs.',
  'Duplicate of an earlier ticket; merged and closed. The fix ships in the next maintenance window alongside the pagination changes.',
]

const TICKETS: Ticket[] = Array.from({ length: 8 }, (_, i) => ({
  id: String(i + 1),
  ref: `TCK-${1001 + i}`,
  subject: SUBJECTS[i % SUBJECTS.length],
  priority: PRIORITIES[i % PRIORITIES.length],
  summary: SUMMARIES[i % SUMMARIES.length],
  resolution: RESOLUTIONS[i % RESOLUTIONS.length],
}))

const priorityColor = (p: Ticket['priority']): ThemeColor =>
  p === 'High' ? 'error' : p === 'Normal' ? 'info' : 'medium'

const columns: TableColumn<Ticket>[] = [
  { key: 'ref', header: 'Ref' }, // default → single line
  { key: 'subject', header: 'Subject' }, // default → single line
  {
    key: 'priority',
    header: 'Priority',
    cell: (t) => <Chip color={priorityColor(t.priority)}>{t.priority}</Chip>,
  },
  { key: 'summary', header: 'Summary', wrap: true }, // wrap → caps at the 280px default
  { key: 'resolution', header: 'Resolution', wrap: true, maxWidth: 420 }, // wrap → wider 420px cap
]

export function TableWrapPage() {
  return (
    <Section>
      <Block
        label="Column widths / wrapping"
        description="Ref, Subject and Priority stay single-line (the default — the table scrolls if they overflow). Summary sets `wrap` (caps at the readable 280px default and flows onto multiple lines, growing the row); Resolution sets `wrap` + `maxWidth: 420` for a wider cap."
      >
        <Table data={TICKETS} columns={columns} getRowId={(t) => t.id} />
      </Block>
    </Section>
  )
}
