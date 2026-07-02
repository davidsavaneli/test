import { Table, type TableColumn } from '../../../src'
import { Block, Section } from '../../shared'

/* Empty state — when `data` is empty the table renders the default patterned `EmptyState` in the body
   (pass `empty` to customise it). The footer / pagination are hidden while there are no rows. */

interface AuditEntry {
  id: string
  action: string
  actor: string
  target: string
  at: string
}

const columns: TableColumn<AuditEntry>[] = [
  { key: 'action', header: 'Action' },
  { key: 'actor', header: 'User' },
  { key: 'target', header: 'Target' },
  { key: 'at', header: 'When', align: 'right' },
]

export function TableEmptyPage() {
  return (
    <Section>
      <Block
        label="Empty state"
        description="No rows → the default patterned EmptyState fills the body; the footer + pagination are hidden. Pass `empty` for a custom node (e.g. a 'Clear filters' action)."
      >
        <Table data={[] as AuditEntry[]} columns={columns} searchable getRowId={(e) => e.id} />
      </Block>
    </Section>
  )
}
