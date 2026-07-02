import { Chip, Table, type TableColumn, type ThemeColor } from '../../../src'
import { Block, Section } from '../../shared'

/* Hide the "All" rows-per-page choice — for a large dataset where loading every row at once is
   undesirable, pass `allowAllRows={false}`. Here: a few hundred invoices. */

interface Invoice {
  id: string
  number: string
  customer: string
  amount: number
  status: 'Paid' | 'Pending' | 'Overdue'
  date: string
  note: string
}

const CUSTOMERS = ['Acme Co', 'Globex', 'Initech', 'Umbrella', 'Soylent', 'Hooli', 'Vehement']
const STATUSES: Invoice['status'][] = ['Paid', 'Pending', 'Overdue']
const NOTES = [
  'Standard net-30 terms.',
  'Escalated to collections after three failed payment reminders and a follow-up call with the account owner.',
  'Partial payment received; remainder due next cycle.',
]

const INVOICES: Invoice[] = Array.from({ length: 240 }, (_, i) => ({
  id: String(i + 1),
  number: `INV-${String(2026000 + i)}`,
  customer: CUSTOMERS[i % CUSTOMERS.length],
  amount: 120 + ((i * 97) % 9000),
  status: STATUSES[i % STATUSES.length],
  date: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
  note: NOTES[i % NOTES.length],
}))

const statusColor = (s: Invoice['status']): ThemeColor =>
  s === 'Paid' ? 'success' : s === 'Pending' ? 'info' : 'error'

const columns: TableColumn<Invoice>[] = [
  { key: 'number', header: 'Invoice' },
  { key: 'customer', header: 'Customer', sortable: true },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    sortable: true,
    cell: (inv) => `$${inv.amount.toLocaleString('en-US')}`,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (inv) => <Chip color={statusColor(inv.status)}>{inv.status}</Chip>,
  },
  { key: 'date', header: 'Date', sortable: true },
  // cells are single-line by default; this free-text column opts into wrapping — `wrap` alone caps it at
  // the readable 280px default (pass `maxWidth` only for a different cap)
  { key: 'note', header: 'Note', wrap: true },
]

export function TableHideAllPage() {
  return (
    <Section>
      <Block
        label="Hide the All option — allowAllRows={false}"
        description="240 invoices — dropping the All choice keeps a user from loading the whole set onto one page. Cells are single-line by default (the table scrolls); the Note column just sets wrap, so a long note caps at the readable 280px default and flows onto 2–3 lines (the row grows)."
      >
        <Table
          data={INVOICES}
          columns={columns}
          getRowId={(inv) => inv.id}
          searchable
          allowAllRows={false}
        />
      </Block>
    </Section>
  )
}
