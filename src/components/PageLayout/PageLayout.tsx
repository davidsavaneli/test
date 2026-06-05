import { forwardRef, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'
import styles from './PageLayout.module.css'

export interface PageLayoutProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * The content container a page's body sits in — a token-styled surface card (border + radius +
 * padding). Rendered by the consumer inside each route, below the shell's breadcrumbs and page
 * title: `<PageLayout>…page content…</PageLayout>`. Styling uses `--tz-*` tokens only.
 */
export const PageLayout = forwardRef<HTMLDivElement, PageLayoutProps>(function PageLayout(
  { className, children, ...props },
  ref,
) {
  return (
    <div ref={ref} className={clsx(styles.pageLayout, className)} {...props}>
      {children}
    </div>
  )
})
