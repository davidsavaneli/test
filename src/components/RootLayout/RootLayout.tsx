import { useState, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { Avatar } from '../Avatar'
import { Col, Row } from '../Flex'
import { Divider } from '../Divider'
import { Dropdown } from '../Dropdown'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { ListItem } from '../List'
import { FullscreenToggle } from '../FullscreenToggle'
import { ThemeToggle } from '../ThemeToggle'
import { Typography } from '../Typography'
import { Breadcrumbs } from '../Breadcrumbs'
import { Sidebar, usePageTitle } from '../Sidebar/Sidebar'
import styles from './RootLayout.module.css'

/** Signed-in user shown in the header avatar + its account menu. */
export interface RootLayoutUser {
  /** Full name — shown as the menu's name line. */
  name?: string
  /** Email shown under the name in the account menu. */
  email?: string
  /** Avatar image URL (falls back to a user icon). */
  avatar?: string
}

export interface RootLayoutHeader {
  /** Show the built-in light/dark theme toggle on the right of the header. Defaults to `true`. */
  theme?: boolean
  /**
   * Show the built-in browser-fullscreen toggle next to the theme toggle. Defaults to `true`. The
   * toggle auto-hides where the Fullscreen API is unavailable (e.g. iOS Safari on iPhone).
   */
  fullscreen?: boolean
  /** When provided, an account `Avatar` appears on the right; its menu has a **Sign out** item that calls this. */
  onLogout?: () => void
  /** Signed-in user — shown in the header avatar and as a header block atop the account menu. */
  user?: RootLayoutUser
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
 * (on by default) plus an account `Avatar` whose menu has a **Sign out** item when `header.onLogout`
 * is given. The content area stacks
 * **`Breadcrumbs` → the page title (the active route's `staticData.name`) → `children`**; pages wrap
 * their own body in `PageLayout`. Styling is token-based, so it follows the active `ConfigProvider`
 * mode. Requires `@tanstack/react-router` (peer).
 */
export function RootLayout({ logo, header, children }: RootLayoutProps) {
  const title = usePageTitle()
  const showTheme = header?.theme ?? true
  const showFullscreen = header?.fullscreen ?? true
  const onLogout = header?.onLogout
  const user = header?.user
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={clsx(styles.shell, collapsed && styles.shellCollapsed)}>
      <aside className={styles.sidebar}>
        {logo ? <div className={styles.brand}>{logo}</div> : null}
        <div className={styles.navScroll}>
          <Sidebar />
        </div>
      </aside>
      <div className={styles.main}>
        <header className={styles.topbar}>
          <IconButton
            aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
            aria-expanded={!collapsed}
            variant="filled"
            size="sm"
            onClick={() => setCollapsed((c) => !c)}
          >
            <Icon name="Menu" />
          </IconButton>
          <div className={styles.headerEnd}>
            {showFullscreen ? <FullscreenToggle variant="filled" size="sm" /> : null}
            {showTheme ? <ThemeToggle variant="filled" size="sm" /> : null}
            {onLogout ? (
              <Dropdown
                placement="bottom-end"
                trigger={
                  <button type="button" className={styles.account} aria-label="Account">
                    <Avatar size="md" icon="User" src={user?.avatar} />
                  </button>
                }
              >
                {user ? (
                  <>
                    <Row gap={8} align="center" padding="var(--tz-space-xxs) var(--tz-space-sm)">
                      <Avatar size="sm" icon="User" src={user.avatar} />
                      <Col gap={2}>
                        {user.name ? (
                          <Typography variant="bodySmall">{user.name}</Typography>
                        ) : null}
                        {user.email ? (
                          <Typography variant="caption" color="muted">
                            {user.email}
                          </Typography>
                        ) : null}
                      </Col>
                    </Row>
                    <Divider />
                  </>
                ) : null}
                <ListItem icon={<Icon name="Logout2" color="error" />} clickable onClick={onLogout}>
                  Sign out
                </ListItem>
              </Dropdown>
            ) : null}
          </div>
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
