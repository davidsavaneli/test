import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Table, type TableColumn } from './Table'

interface Row {
  id: string
  name: string
  role: string
  age: number
}

const makeData = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    name: `User ${i + 1}`,
    role: i % 2 ? 'Admin' : 'Member',
    age: 20 + i,
  }))

const columns: TableColumn<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role' },
  { key: 'age', header: 'Age', sortable: true },
]

const bodyRowCount = () => within(screen.getByRole('table')).getAllByRole('row').length - 1 // minus the header row

// isolate the URL between tests (the table URL-syncs page + size by default)
beforeEach(() => window.history.replaceState({}, '', '/'))

describe('Table', () => {
  it('renders headers and the first page of rows', () => {
    render(<Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Name/ })).toBeInTheDocument()
    expect(screen.getByText('User 1')).toBeInTheDocument()
    expect(screen.queryByText('User 11')).not.toBeInTheDocument() // page 2
    expect(bodyRowCount()).toBe(10) // default pageSize
    expect(screen.getByText(/1.10 of 25/)).toBeInTheDocument() // range text
  })

  it('renders a custom cell', () => {
    render(
      <Table
        data={makeData(3)}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'role', header: 'Role', cell: (r) => <span data-testid="chip">{r.role}!</span> },
        ]}
        getRowId={(r) => r.id}
      />,
    )
    expect(screen.getAllByTestId('chip')[0]).toHaveTextContent('Member!')
  })

  it('paginates to the next page', () => {
    render(<Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))
    expect(screen.getByText('User 11')).toBeInTheDocument()
    expect(screen.queryByText('User 1')).not.toBeInTheDocument()
    expect(screen.getByText(/11.20 of 25/)).toBeInTheDocument()
  })

  it('shows the first / last jump buttons by default', () => {
    render(<Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} />)
    expect(screen.getByRole('button', { name: 'Go to first page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to last page' })).toBeInTheDocument()
  })

  it('shows every row on one page for the "All" rows-per-page (size=all)', () => {
    window.history.replaceState({}, '', '/?page=1&size=all')
    render(<Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} />)
    expect(bodyRowCount()).toBe(25)
    expect(screen.getByText(/1.25 of 25/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Go to page 2' })).not.toBeInTheDocument()
  })

  it('ignores size=all and falls back to the default when allowAllRows is false', () => {
    window.history.replaceState({}, '', '/?page=1&size=all')
    render(
      <Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} allowAllRows={false} />,
    )
    expect(bodyRowCount()).toBe(10) // default page size, All rejected
  })

  it('filters locally via the search box (debounced)', async () => {
    render(
      <Table
        data={makeData(25)}
        columns={columns}
        getRowId={(r) => r.id}
        searchable
        debounceMs={0}
      />,
    )
    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), {
      target: { value: 'User 25' },
    })
    await waitFor(() => expect(screen.getByText(/1.1 of 1/)).toBeInTheDocument())
    expect(screen.getByText('User 25')).toBeInTheDocument()
    expect(bodyRowCount()).toBe(1)
  })

  it('sorts by a sortable column and reflects aria-sort', () => {
    render(<Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} />)
    const ageHeader = screen.getByRole('columnheader', { name: /Age/ })
    const ageButton = within(ageHeader).getByRole('button')
    fireEvent.click(ageButton) // asc
    expect(ageHeader).toHaveAttribute('aria-sort', 'ascending')
    fireEvent.click(ageButton) // desc — highest age first, resets to page 1
    expect(ageHeader).toHaveAttribute('aria-sort', 'descending')
    expect(screen.getByText('User 25')).toBeInTheDocument() // age 44, now first
    expect(screen.queryByText('User 1')).not.toBeInTheDocument()
  })

  it('pins a column to the right with the pinnedRight class (header + body cells)', () => {
    render(
      <Table
        data={makeData(3)}
        getRowId={(r) => r.id}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'actions', header: '', pinned: 'right', cell: () => <button>Go</button> },
        ]}
      />,
    )
    const headers = screen.getAllByRole('columnheader')
    expect(headers[1]).toHaveClass('pinnedRight')
    const cells = within(screen.getByRole('table')).getAllByRole('cell')
    expect(cells.some((c) => c.classList.contains('pinnedRight'))).toBe(true)
  })

  it('shows the empty state and no footer when there are no rows', () => {
    render(<Table data={[]} columns={columns} />)
    expect(screen.getByText(/No Results Found/i)).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument() // no pagination
  })

  it('renders a loading overlay', () => {
    render(<Table data={makeData(10)} columns={columns} getRowId={(r) => r.id} loading />)
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument() // Loader
  })

  describe('server mode', () => {
    it('fires onChange on mount and on page change; rowCount drives the page count', () => {
      const onChange = vi.fn()
      render(
        <Table
          data={makeData(10)}
          columns={columns}
          getRowId={(r) => r.id}
          manualPagination
          rowCount={100}
          onChange={onChange}
        />,
      )
      expect(onChange).toHaveBeenCalledWith({ page: 1, size: 10, search: '', sort: null })
      expect(screen.getByText(/1.10 of 100/)).toBeInTheDocument()
      onChange.mockClear()
      fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))
      expect(onChange).toHaveBeenCalledWith({ page: 2, size: 10, search: '', sort: null })
    })

    it('does not slice the data in server mode (shows exactly what it is given)', () => {
      render(
        <Table
          data={makeData(3)}
          columns={columns}
          getRowId={(r) => r.id}
          manualPagination
          rowCount={100}
        />,
      )
      expect(bodyRowCount()).toBe(3) // the server page as-is, not sliced to pageSize
    })
  })

  describe('URL sync', () => {
    it('canonicalizes page + size into the query on mount', () => {
      render(<Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} />)
      const params = new URLSearchParams(window.location.search)
      expect(params.get('page')).toBe('1')
      expect(params.get('size')).toBe('10')
    })

    it('reads the initial page from the URL', () => {
      window.history.replaceState({}, '', '/?page=2&size=10')
      render(<Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} />)
      expect(screen.getByText('User 11')).toBeInTheDocument() // page 2
      expect(screen.queryByText('User 1')).not.toBeInTheDocument()
    })

    it('writes the page to the URL when navigating', async () => {
      render(<Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} />)
      fireEvent.click(screen.getByRole('button', { name: 'Go to page 3' }))
      await waitFor(() => expect(new URLSearchParams(window.location.search).get('page')).toBe('3'))
    })

    it('does not touch the URL when urlSync is false', () => {
      render(<Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} urlSync={false} />)
      expect(window.location.search).toBe('')
    })
  })

  it('makes rows clickable via onRowClick', () => {
    const onRowClick = vi.fn()
    render(
      <Table data={makeData(3)} columns={columns} getRowId={(r) => r.id} onRowClick={onRowClick} />,
    )
    fireEvent.click(screen.getByText('User 2'))
    expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ name: 'User 2' }), 1)
  })
})
