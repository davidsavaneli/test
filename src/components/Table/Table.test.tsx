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

  it('renders a "—" placeholder for an empty cell, but keeps a real 0', () => {
    interface Item {
      id: string
      name: string
      brand: string
      stock: number
    }
    const data: Item[] = [
      { id: '1', name: 'Sofa', brand: 'Acme', stock: 0 },
      { id: '2', name: 'Apple', brand: '', stock: 5 },
    ]
    render(
      <Table
        data={data}
        getRowId={(r) => r.id}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'brand', header: 'Brand' },
          { key: 'stock', header: 'Stock' },
        ]}
      />,
    )
    expect(screen.getByText('—')).toBeInTheDocument() // the empty brand cell
    expect(screen.getByText('0')).toBeInTheDocument() // 0 stock is a real value, not blank
  })

  it('paginates to the next page', () => {
    render(<Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))
    expect(screen.getByText('User 11')).toBeInTheDocument()
    expect(screen.queryByText('User 1')).not.toBeInTheDocument()
    expect(screen.getByText(/11.20 of 25/)).toBeInTheDocument()
  })

  it('hides the pagination nav when everything fits on one page (keeps the range + size select)', () => {
    render(<Table data={makeData(5)} columns={columns} getRowId={(r) => r.id} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument() // no page navigator
    expect(screen.getByText(/1.5 of 5/)).toBeInTheDocument() // range still shown
  })

  it('hides the first / last jump buttons by default, shows them when enabled', () => {
    const { rerender } = render(
      <Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} />,
    )
    expect(screen.queryByRole('button', { name: 'Go to first page' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Go to last page' })).not.toBeInTheDocument()
    rerender(
      <Table
        data={makeData(25)}
        columns={columns}
        getRowId={(r) => r.id}
        showFirstButton
        showLastButton
      />,
    )
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

  it('sorts via the toolbar sort menu (explicit asc / desc entries), reflected in aria-sort', () => {
    render(<Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} />)
    const ageHeader = screen.getByRole('columnheader', { name: /Age/ })
    // no sort control in the header any more — it lives in the toolbar menu
    expect(within(ageHeader).queryByRole('button')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Sort' })) // open the sort menu
    fireEvent.click(within(screen.getByRole('menu')).getByText('Age ascending'))
    expect(ageHeader).toHaveAttribute('aria-sort', 'ascending')

    fireEvent.click(screen.getByRole('button', { name: 'Sort' })) // reopen (menu closes on select)
    fireEvent.click(within(screen.getByRole('menu')).getByText('Age descending')) // resets to page 1
    expect(ageHeader).toHaveAttribute('aria-sort', 'descending')
    expect(screen.getByText('User 25')).toBeInTheDocument() // age 44, now first
    expect(screen.queryByText('User 1')).not.toBeInTheDocument()
  })

  it('the sort menu lists an ascending + descending entry for each sortable column only', () => {
    render(<Table data={makeData(3)} columns={columns} getRowId={(r) => r.id} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sort' }))
    const menu = screen.getByRole('menu')
    expect(within(menu).getByText('Name ascending')).toBeInTheDocument()
    expect(within(menu).getByText('Name descending')).toBeInTheDocument()
    expect(within(menu).getByText('Age ascending')).toBeInTheDocument()
    expect(within(menu).getByText('Age descending')).toBeInTheDocument()
    expect(within(menu).queryByText(/Role/)).toBeNull() // Role isn't sortable
  })

  it('shows no sort button when no column is sortable', () => {
    render(
      <Table
        data={makeData(3)}
        getRowId={(r) => r.id}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'role', header: 'Role' },
        ]}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Sort' })).toBeNull()
  })

  it('flags an applied sort with a dot badge on the trigger', () => {
    const { container } = render(
      <Table data={makeData(5)} columns={columns} getRowId={(r) => r.id} />,
    )
    expect(container.querySelector('.dot')).toBeNull() // no sort yet → no dot
    fireEvent.click(screen.getByRole('button', { name: 'Sort' }))
    fireEvent.click(within(screen.getByRole('menu')).getByText('Age ascending'))
    expect(container.querySelector('.dot')).not.toBeNull() // sorted → dot shown
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

  it('is single-line by default; wrap caps at 280, maxWidth overrides the cap', () => {
    render(
      <Table
        data={makeData(2)}
        getRowId={(r) => r.id}
        columns={[
          { key: 'name', header: 'Name' }, // default: single-line, no cap
          { key: 'role', header: 'Role', wrap: true }, // wrap alone → the readable 280px default
          { key: 'age', header: 'Age', wrap: true, maxWidth: 400 }, // own cap wins
        ]}
      />,
    )
    const nameHeader = screen.getByRole('columnheader', { name: 'Name' })
    expect(nameHeader).not.toHaveClass('wrapCell')
    expect(nameHeader.style.maxWidth).toBe('') // no cap — single line, table scrolls
    const roleHeader = screen.getByRole('columnheader', { name: 'Role' })
    expect(roleHeader).toHaveClass('wrapCell')
    // a wrap column sits AT its cap (both width + max-width) so it isn't starved to per-character wrapping
    expect(roleHeader).toHaveStyle({ width: '280px', maxWidth: '280px' }) // default wrap cap
    expect(screen.getByRole('columnheader', { name: 'Age' })).toHaveStyle({
      width: '400px',
      maxWidth: '400px',
    })
  })

  it('renders the actions render-prop in a pinned column; its clicks do not fire onRowClick', () => {
    const onEdit = vi.fn()
    const onRowClick = vi.fn()
    render(
      <Table
        data={makeData(3)}
        columns={columns}
        getRowId={(r) => r.id}
        onRowClick={onRowClick}
        actions={(r) => (
          <button type="button" aria-label={`Edit ${r.name}`} onClick={() => onEdit(r.name)}>
            edit
          </button>
        )}
      />,
    )
    // the auto-built actions column is pinned right
    const cells = within(screen.getByRole('table')).getAllByRole('cell')
    expect(cells.some((c) => c.classList.contains('pinnedRight'))).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Edit User 1' }))
    expect(onEdit).toHaveBeenCalledWith('User 1')
    expect(onRowClick).not.toHaveBeenCalled() // the actions cell swallows the click
  })

  it('shows the empty state and no footer when there are no rows', () => {
    render(<Table data={[]} columns={columns} />)
    expect(screen.getByText(/No Results Found/i)).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument() // no pagination
  })

  it('dims the rows with a loading overlay while refetching (rows already present)', () => {
    render(<Table data={makeData(10)} columns={columns} getRowId={(r) => r.id} loading />)
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument() // Loader
    expect(screen.getByText('User 1')).toBeInTheDocument() // rows stay visible under the overlay
  })

  it('shows a centered loader placeholder (not the empty state) while loading with no rows', () => {
    render(<Table data={[]} columns={columns} loading />)
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument() // Loader in the body
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.queryByText(/No Results Found/i)).not.toBeInTheDocument() // not the empty state
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
      // the emitted state also carries the built `params`/`query` (default page-based mapping)
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          size: 10,
          search: '',
          sort: null,
          query: 'page=1&size=10',
        }),
      )
      expect(screen.getByText(/1.10 of 100/)).toBeInTheDocument()
      onChange.mockClear()
      fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, query: 'page=2&size=10' }),
      )
    })

    it('builds state.query from queryMapping (offset + separate sort, renamed params)', () => {
      const onChange = vi.fn()
      render(
        <Table
          data={makeData(10)}
          columns={columns}
          getRowId={(r) => r.id}
          manualPagination
          rowCount={100}
          defaultSort={{ key: 'age', direction: 'desc' }}
          onChange={onChange}
          queryMapping={{
            page: 'skip',
            size: 'limit',
            search: 'q',
            sort: 'sortBy',
            pagination: 'offset',
            sortFormat: 'separate',
          }}
        />,
      )
      // page 1 @ size 10 → skip=0; desc age sort → sortBy=age&order=desc
      const state = onChange.mock.calls[0][0] as { params: URLSearchParams; query: string }
      expect(state.params.get('skip')).toBe('0')
      expect(state.params.get('limit')).toBe('10')
      expect(state.params.get('sortBy')).toBe('age')
      expect(state.params.get('order')).toBe('desc')
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

  describe('export', () => {
    it('exports the current page to CSV and offers "Export All" in local mode', () => {
      // jsdom's Blob lacks .text(), so capture the CSV via a Blob mock; stub URL + anchor click (download)
      const parts: string[] = []
      class MockBlob {
        type: string
        constructor(chunks: string[], opts?: { type?: string }) {
          parts.push(chunks.join(''))
          this.type = opts?.type ?? ''
        }
      }
      vi.stubGlobal('Blob', MockBlob)
      vi.stubGlobal('URL', {
        ...URL,
        createObjectURL: vi.fn(() => 'blob:x'),
        revokeObjectURL: vi.fn(),
      })
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

      render(<Table data={makeData(3)} columns={columns} getRowId={(r) => r.id} exportable />)
      fireEvent.click(screen.getByRole('button', { name: 'Export' }))
      const menu = screen.getByRole('menu')
      expect(within(menu).getByText('Export All')).toBeInTheDocument() // local only
      fireEvent.click(within(menu).getByText('Export This Page'))

      expect(click).toHaveBeenCalled() // a download was triggered
      const csv = parts[parts.length - 1] ?? ''
      expect(csv).toContain('Name,Role,Age') // header row from the column headers
      expect(csv).toContain('User 1,Member,20') // first data row (raw key values)

      click.mockRestore()
      vi.unstubAllGlobals()
    })

    it('hides "Export All" in server mode (only the current page is available)', () => {
      render(
        <Table
          data={makeData(3)}
          columns={columns}
          getRowId={(r) => r.id}
          manualPagination
          rowCount={50}
          exportable
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Export' }))
      const menu = screen.getByRole('menu')
      expect(within(menu).getByText('Export This Page')).toBeInTheDocument()
      expect(within(menu).queryByText('Export All')).toBeNull()
    })

    it('runs a custom export action with the current table state (query)', () => {
      const onClick = vi.fn()
      render(
        <Table
          data={makeData(3)}
          columns={columns}
          getRowId={(r) => r.id}
          exportActions={[{ label: 'Send On Email', onClick }]}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Export' }))
      fireEvent.click(within(screen.getByRole('menu')).getByText('Send On Email'))
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, size: 10, query: 'page=1&size=10' }),
      )
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

    it('drops page from the URL on the "All" rows-per-page (leaves just ?size=all)', async () => {
      render(<Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} />)
      fireEvent.click(screen.getByRole('combobox')) // open the rows-per-page select
      fireEvent.click(screen.getByRole('option', { name: 'All' }))
      await waitFor(() => {
        const params = new URLSearchParams(window.location.search)
        expect(params.get('size')).toBe('all')
        expect(params.has('page')).toBe(false) // no meaningful page on "All"
      })
    })

    it('does not touch the URL when urlSync is false', () => {
      render(<Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} urlSync={false} />)
      expect(window.location.search).toBe('')
    })

    it('syncs the search query to ?search= (and removes it when cleared)', async () => {
      render(
        <Table
          data={makeData(25)}
          columns={columns}
          getRowId={(r) => r.id}
          searchable
          debounceMs={0}
        />,
      )
      const input = screen.getByRole('textbox', { name: 'Search' })
      fireEvent.change(input, { target: { value: 'User 25' } })
      await waitFor(() =>
        expect(new URLSearchParams(window.location.search).get('search')).toBe('User 25'),
      )
      fireEvent.change(input, { target: { value: '' } })
      await waitFor(() =>
        expect(new URLSearchParams(window.location.search).has('search')).toBe(false),
      )
    })

    it('syncs sort to ?sort= (key asc / -key desc)', async () => {
      render(<Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} />)
      fireEvent.click(screen.getByRole('button', { name: 'Sort' })) // open the sort menu
      fireEvent.click(within(screen.getByRole('menu')).getByText('Age ascending'))
      await waitFor(() =>
        expect(new URLSearchParams(window.location.search).get('sort')).toBe('age'),
      )
      fireEvent.click(screen.getByRole('button', { name: 'Sort' })) // reopen (menu closes on select)
      fireEvent.click(within(screen.getByRole('menu')).getByText('Age descending'))
      await waitFor(() =>
        expect(new URLSearchParams(window.location.search).get('sort')).toBe('-age'),
      )
    })

    it('reads the initial search + sort from the URL', () => {
      window.history.replaceState({}, '', '/?search=User+07&sort=-age')
      render(<Table data={makeData(25)} columns={columns} getRowId={(r) => r.id} searchable />)
      expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('User 07')
      expect(screen.getByRole('columnheader', { name: /Age/ })).toHaveAttribute(
        'aria-sort',
        'descending',
      )
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
