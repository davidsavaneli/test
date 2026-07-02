import { Chip, Icon, IconButton, Table, type TableColumn, type ThemeColor } from '../../../src'
import { Block, Section } from '../../shared'

/* Local mode — hand the table the WHOLE dataset and it searches / sorts / paginates client-side.
   The flagship example: sortable columns, a Chip cell, the `actions` prop (a pinned actions column the
   table builds for you), and URL-synced paging. */

interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'Active' | 'Invited' | 'Suspended'
  joined: string
}

const ROLES = ['Admin', 'Editor', 'Viewer']
const STATUSES: User['status'][] = ['Active', 'Invited', 'Suspended']

const USERS: User[] = Array.from({ length: 53 }, (_, i) => ({
  id: String(i + 1),
  name: `User ${String(i + 1).padStart(2, '0')}`,
  email: `user${i + 1}@techzy.app`,
  role: ROLES[i % ROLES.length],
  status: STATUSES[i % STATUSES.length],
  joined: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
}))

const statusColor = (s: User['status']): ThemeColor =>
  s === 'Active' ? 'success' : s === 'Invited' ? 'info' : 'error'

const columns: TableColumn<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'role', header: 'Role' },
  {
    key: 'status',
    header: 'Status',
    cell: (u) => <Chip color={statusColor(u.status)}>{u.status}</Chip>,
  },
  { key: 'joined', header: 'Joined', sortable: true },
]

export function TableLocalPage() {
  return (
    <Section>
      <Block
        label="Local — client-side search / sort / paginate"
        description="Pass the full data + columns. Type to search, click a sortable header, change rows per page (10 / 20 / 50 / 100 / 200 / All), use the first/last jump arrows. Page + size sync to the URL (?page=1&size=10) — refresh to restore. Edit / Delete come from the `actions` prop (a pinned column the table builds)."
      >
        <Table
          data={USERS}
          columns={columns}
          getRowId={(u) => u.id}
          searchable
          // `actions` is a render function → your own JSX; the table pins it right + swallows the click
          actions={(u) => (
            <>
              <IconButton
                size="sm"
                variant="text"
                aria-label={`Edit ${u.name}`}
                onClick={() => alert(`Edit ${u.name}`)}
              >
                <Icon name="Edit2" />
              </IconButton>
              <IconButton
                size="sm"
                variant="text"
                color="error"
                aria-label={`Delete ${u.name}`}
                onClick={() => alert(`Delete ${u.name}`)}
              >
                <Icon name="Trash" />
              </IconButton>
            </>
          )}
        />
      </Block>
    </Section>
  )
}
