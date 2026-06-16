import { forwardRef } from 'react'
import { Card, type CardProps } from '../Card'

/** PageLayout is a flat `Card`, so it gains all of Card's slots minus the `flat` toggle (always flat). */
export interface PageLayoutProps extends Omit<CardProps, 'flat'> {}

/**
 * The content container a page's body sits in — a **flat `Card`** (no shadow, the page `background`
 * color), so it blends with the shell while the Cards/inputs placed inside it read as elevated. Being
 * a Card, it gains the full Card anatomy: an optional header (`icon` + `title` + `subtitle` +
 * `actions`), the body (`children`), a `footer` / `footerStart`, and `collapsible`. Rendered by the
 * consumer inside each route, below the shell's breadcrumbs + page title:
 * `<PageLayout title="Settings" actions={…}>…</PageLayout>`. Styling uses `--tz-*` tokens only.
 */
export const PageLayout = forwardRef<HTMLDivElement, PageLayoutProps>(
  function PageLayout(props, ref) {
    return <Card ref={ref} flat {...props} />
  },
)
