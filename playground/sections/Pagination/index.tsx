import { useState } from 'react'
import { Col, List, ListItem, Pagination, Row, Typography } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

const COLORS = ['brand', 'primary', 'success', 'info', 'warning', 'error'] as const

export function PaginationSection() {
  const [page, setPage] = useState(5)

  return (
    <Section>
      <Block
        label="Basic — controlled"
        description="Drive it with page + onChange. Boundary pages + the current page's siblings, with … gaps."
      >
        <Col gap={12}>
          <Pagination count={10} page={page} onChange={setPage} />
          <Typography variant="bodySmall" color="muted">
            Page {page} of 10
          </Typography>
        </Col>
      </Block>

      <Block label="Variants — outlined (default) / text">
        <Col gap={16}>
          <Pagination count={10} defaultPage={5} variant="outlined" />
          <Pagination count={10} defaultPage={5} variant="text" />
        </Col>
      </Block>

      <Block label="Sizes — sm / md / lg">
        <Col gap={16}>
          {SIZES.map((s) => (
            <Pagination key={s} count={10} defaultPage={5} size={s} />
          ))}
        </Col>
      </Block>

      <Block label="Colors — the selected page tint follows the color prop">
        <Col gap={16}>
          {COLORS.map((c) => (
            <Pagination key={c} count={10} defaultPage={5} color={c} />
          ))}
        </Col>
      </Block>

      <Block label="Rounded — circular page buttons">
        <Pagination count={10} defaultPage={5} rounded />
      </Block>

      <Block
        label="First / last jump buttons"
        description="showFirstButton + showLastButton add ⏮ / ⏭ controls that jump to the ends."
      >
        <Pagination count={20} defaultPage={10} showFirstButton showLastButton />
      </Block>

      <Block
        label="siblingCount / boundaryCount"
        description="More pages around the current one (siblingCount=2) and pinned at the edges (boundaryCount=2)."
      >
        <Col gap={16}>
          <Pagination count={20} defaultPage={10} siblingCount={2} />
          <Pagination count={20} defaultPage={10} boundaryCount={2} />
          <Pagination count={20} defaultPage={10} siblingCount={0} />
        </Col>
      </Block>

      <Block label="Few pages — no ellipsis">
        <Pagination count={4} defaultPage={2} />
      </Block>

      <Block label="Disabled">
        <Pagination count={10} defaultPage={5} disabled />
      </Block>

      <Block
        label="Reuse — paginating a list"
        description="count = Math.ceil(total / pageSize); the page slices the data and a counter shows the range."
      >
        <PaginatedList />
      </Block>
    </Section>
  )
}

/** A small client-side paged list — the everyday way a table/list reuses Pagination. */
const ALL_ITEMS = Array.from({ length: 47 }, (_, i) => `Item ${i + 1}`)
const PAGE_SIZE = 6

function PaginatedList() {
  const [page, setPage] = useState(1)
  const total = ALL_ITEMS.length
  const count = Math.ceil(total / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE
  const visible = ALL_ITEMS.slice(start, start + PAGE_SIZE)

  return (
    <Col gap={12}>
      <List>
        {visible.map((label) => (
          <ListItem key={label} icon="Box">
            {label}
          </ListItem>
        ))}
      </List>
      <Row justify="between" align="center" wrap gap={12}>
        <Typography variant="bodySmall" color="muted">
          Showing {start + 1}–{Math.min(start + PAGE_SIZE, total)} of {total}
        </Typography>
        <Pagination count={count} page={page} onChange={setPage} />
      </Row>
    </Col>
  )
}
