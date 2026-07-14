import { useState } from 'react'
import { Chip, Table, Typography, type TableColumn, type ThemeColor } from '../../../src'
import { Block, Section } from '../../shared'

/* Row drag & drop — `reorderable` prepends a drag-handle column; grab a row's grip and drop it to reorder
   (or focus the handle → Space → Arrow keys → Space). The table owns nothing: you hold `data`, and
   `onReorder` hands you the reordered array to set. Local mode, no sort / search / pagination so the manual
   order is the whole story; `getRowId` gives dnd its stable row ids. Built on `@dnd-kit`. */

interface Task {
  id: string
  name: string
  owner: string
  priority: 'Low' | 'Medium' | 'High'
}

const priorityColor = (p: Task['priority']): ThemeColor =>
  p === 'High' ? 'error' : p === 'Medium' ? 'warning' : 'success'

const INITIAL: Task[] = [
  { id: 't1', name: 'Design the dashboard', owner: 'Nino', priority: 'High' },
  { id: 't2', name: 'Wire the auth flow', owner: 'Dato', priority: 'High' },
  { id: 't3', name: 'Write the API client', owner: 'Ana', priority: 'Medium' },
  { id: 't4', name: 'Set up CI', owner: 'Giorgi', priority: 'Low' },
  { id: 't5', name: 'Draft the release notes', owner: 'Mari', priority: 'Low' },
  { id: 't6', name: 'Polish the empty states', owner: 'Luka', priority: 'Medium' },
]

const columns: TableColumn<Task>[] = [
  { key: 'name', header: 'Task', wrap: true },
  { key: 'owner', header: 'Owner' },
  {
    key: 'priority',
    header: 'Priority',
    cell: (t) => <Chip color={priorityColor(t.priority)}>{t.priority}</Chip>,
  },
]

export function TableReorderPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL)
  return (
    <Section>
      <Block
        label="Row reorder — drag & drop"
        description="Grab a row's drag handle (the grip on the left) and drop it to reorder — or focus the handle and use Space + Arrow keys. `reorderable` + `onReorder` (you hold the data + set it from the reordered array). `getRowId` is required (dnd needs stable row ids)."
      >
        <Table
          data={tasks}
          columns={columns}
          getRowId={(t) => t.id}
          reorderable
          onReorder={(rows, meta) => {
            // log the dragged row's id + where it landed (from `meta`), then commit the reordered array
            console.log('reorder →', 'dragged id:', meta.id, '| from:', meta.from, '→ to:', meta.to)
            setTasks(rows)
          }}
          urlSync={false}
        />
        <Typography
          variant="bodySmall"
          color="muted"
          as="div"
          style={{ marginTop: 'var(--tz-space-sm)' }}
        >
          Order: {tasks.map((t) => t.id).join(' → ')}
        </Typography>
      </Block>
    </Section>
  )
}
