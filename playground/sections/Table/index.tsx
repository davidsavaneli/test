import { useCallback, useRef, useState } from 'react'
import {
  Chip,
  Icon,
  IconButton,
  Row,
  Table,
  type TableChangeState,
  type TableColumn,
  type ThemeColor,
} from '../../../src'
import { Block, Section } from '../../shared'

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

const makeUsers = (n: number): User[] =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    name: `User ${String(i + 1).padStart(2, '0')}`,
    email: `user${i + 1}@techzy.app`,
    role: ROLES[i % ROLES.length],
    status: STATUSES[i % STATUSES.length],
    joined: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
  }))

const ALL_USERS = makeUsers(53)

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
  {
    // a synthetic (no data field) right-aligned actions column, pinned so it stays visible while the
    // rest scrolls; its buttons stopPropagation so they don't trigger a row's onClick
    key: 'actions',
    header: '',
    align: 'right',
    pinned: 'right',
    cell: (u) => (
      <Row gap={4} justify="end">
        <IconButton
          size="sm"
          variant="text"
          aria-label={`Edit ${u.name}`}
          onClick={(e) => {
            e.stopPropagation()
            alert(`Edit ${u.name}`)
          }}
        >
          <Icon name="Edit2" />
        </IconButton>
        <IconButton
          size="sm"
          variant="text"
          color="error"
          aria-label={`Delete ${u.name}`}
          onClick={(e) => {
            e.stopPropagation()
            alert(`Delete ${u.name}`)
          }}
        >
          <Icon name="Trash" />
        </IconButton>
      </Row>
    ),
  },
]

/** Local — the whole dataset, searched / sorted / paginated client-side. */
export function TableLocalPage() {
  return (
    <Section>
      <Block
        label="Local — client-side search / sort / paginate"
        description="Pass data + columns. Type to search, click a sortable header, change rows per page (10 / 20 / 50 / 100 / 200 / All), use the first/last jump arrows. Page + size sync to the URL (?page=1&size=10) — refresh to restore. The right-hand Edit / Delete are a synthetic actions column."
      >
        <Table data={ALL_USERS} columns={columns} getRowId={(u) => u.id} searchable />
      </Block>
    </Section>
  )
}

/** Striped rows + row click. */
export function TableStripedPage() {
  return (
    <Section>
      <Block
        label="Striped + clickable rows"
        description="striped zebra-stripes rows; onRowClick makes them interactive (the action buttons stopPropagation, so they don't fire the row click)."
      >
        <Table
          data={ALL_USERS.slice(0, 12)}
          columns={columns}
          getRowId={(u) => u.id}
          striped
          onRowClick={(u) => alert(`Clicked ${u.name}`)}
        />
      </Block>
    </Section>
  )
}

/** Hide the All rows-per-page choice. */
export function TableHideAllPage() {
  return (
    <Section>
      <Block
        label="Hide the All option — allowAllRows={false}"
        description="For a large dataset where fetching every row is undesirable, drop the All choice from the rows-per-page select."
      >
        <Table data={ALL_USERS} columns={columns} getRowId={(u) => u.id} allowAllRows={false} />
      </Block>
    </Section>
  )
}

/** Server-driven pagination. */
export function TableServerPage() {
  return (
    <Section>
      <Block
        label="Server — you fetch each page; the table just drives the state"
        description="manualPagination: data is only the current page + rowCount is the total. onChange (debounced search) drives a simulated 600ms fetch; a loading overlay shows while it resolves. Page + size sync to ?page & ?size, just like local."
      >
        <ServerDemo />
      </Block>
    </Section>
  )
}

/** Empty state. */
export function TableEmptyPage() {
  return (
    <Section>
      <Block label="Empty state" description="No rows → the default patterned EmptyState.">
        <Table data={[]} columns={columns} searchable urlSync={false} />
      </Block>
    </Section>
  )
}

/** A simulated server-backed table: onChange triggers a debounced "fetch" that slices ALL_USERS. */
function ServerDemo() {
  const [rows, setRows] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fetchPage = useCallback((state: TableChangeState) => {
    setLoading(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      let data = ALL_USERS
      if (state.search) {
        const q = state.search.toLowerCase()
        data = data.filter(
          (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
        )
      }
      if (state.sort) {
        const { key, direction } = state.sort
        data = [...data].sort((a, b) => {
          const av = (a as unknown as Record<string, unknown>)[key] as string
          const bv = (b as unknown as Record<string, unknown>)[key] as string
          const r = av < bv ? -1 : av > bv ? 1 : 0
          return direction === 'asc' ? r : -r
        })
      }
      const start = (state.page - 1) * state.size
      setRows(data.slice(start, start + state.size))
      setTotal(data.length)
      setLoading(false)
    }, 600)
  }, [])

  return (
    <Table
      manualPagination
      data={rows}
      rowCount={total}
      loading={loading}
      onChange={fetchPage}
      columns={columns}
      getRowId={(u) => u.id}
      searchable
    />
  )
}
