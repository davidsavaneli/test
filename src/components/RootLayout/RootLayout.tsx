import type { ReactNode } from 'react'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { ThemeToggle } from '../ThemeToggle'
import { Typography } from '../Typography'
import { Breadcrumbs } from '../Breadcrumbs'
import { Sidebar, usePageTitle } from '../Sidebar/Sidebar'
import styles from './RootLayout.module.css'

export interface RootLayoutHeader {
  /** Show the built-in light/dark theme toggle on the right of the header. Defaults to `true`. */
  theme?: boolean
  /** When provided, renders a logout button on the right of the header that calls this on click. */
  onLogout?: () => void
}

export interface RootLayoutProps {
  /** Brand logo at the top of the sidebar — pass an `<img>`, an `<Icon>`, or any node. */
  logo?: ReactNode
  /** Header config: the built-in theme toggle (`theme`, default `true`) and an optional `onLogout`. */
  header?: RootLayoutHeader
  /** Routed content — the consumer passes `<Outlet />`. */
  children: ReactNode
}

/**
 * The admin-panel shell: a left sidebar (`logo` + auto-generated `Sidebar`), a top header, and a
 * content container. Set it as the root route's component and pass `<Outlet />` as `children`; the
 * `Sidebar` builds itself from the routes' `staticData`. The header holds an optional `ThemeToggle`
 * (on by default) plus a logout button when `header.onLogout` is given. The content area stacks
 * **`Breadcrumbs` → the page title (the active route's `staticData.name`) → `children`**; pages wrap
 * their own body in `PageLayout`. Styling is token-based, so it follows the active `ThemeProvider`
 * mode. Requires `@tanstack/react-router` (peer).
 */
export function RootLayout({ logo, header, children }: RootLayoutProps) {
  const title = usePageTitle()
  const showTheme = header?.theme ?? true
  const onLogout = header?.onLogout

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        {logo ? <div className={styles.brand}>{logo}</div> : null}
        <div className={styles.navScroll}>
          <Sidebar />
        </div>
      </aside>
      <div className={styles.main}>
        <header className={styles.topbar}>
          {showTheme ? <ThemeToggle size="sm" /> : null}
          {onLogout ? (
            <IconButton aria-label="Log out" variant="text" size="sm" onClick={onLogout}>
              <Icon name="Logout" />
            </IconButton>
          ) : null}
        </header>
        <main className={styles.content}>
          <Breadcrumbs />
          {title ? (
            <Typography variant="h2" className={styles.pageTitle}>
              {title}
            </Typography>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  )
}
