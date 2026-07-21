import { useState, type ReactNode } from 'react'
import { clsx } from 'clsx'
import {
  useHeaderConfig,
  useLanguage,
  useT,
  useTheme,
  type HeaderConfig,
  type HeaderUser,
} from '../../theme'
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
import { Toaster, type ToasterProps } from '../Toast'
import { NavSearch, Sidebar, usePageTitle } from '../Sidebar/Sidebar'
import { Flag } from '../Flag'
import { SettingsDrawer } from './SettingsDrawer'
import styles from './RootLayout.module.css'

/**
 * The shell header config + its user shape now live in the theme layer (so `config.header` can carry
 * them app-wide). These aliases keep the historical `RootLayout*` names importable.
 */
export type RootLayoutUser = HeaderUser
export type RootLayoutHeader = HeaderConfig

export interface RootLayoutProps {
  /** Brand logo at the top of the sidebar card — pass an `<img>`, an `<Icon>`, or any node. */
  logo?: ReactNode
  /** Optional content pinned to the **bottom of the sidebar** (e.g. a promo / "Need help?" card). */
  sidebarFooter?: ReactNode
  /**
   * Header config for **this** shell — merged **over** the app-wide `config.header` (the prop wins).
   * Fields: the built-in `theme` / `search` / `settings` toggles (default `true`), `fullscreen`
   * (default `false`), `breadcrumbs` (default `true`), `pageTitle` (default `true`), and the account
   * (`onLogout` / `user`).
   */
  header?: RootLayoutHeader
  /**
   * The built-in toast viewport, mounted for you so `toast.*()` works app-wide with no extra setup.
   * Defaults to `true` (a `<Toaster>` with its defaults). Pass `ToasterProps` to configure it
   * (`{ position, duration }`), or `false` to opt out — e.g. when you mount your own `<Toaster>`.
   */
  toaster?: boolean | ToasterProps
  /** Routed content — the consumer passes `<Outlet />`. */
  children: ReactNode
}

/**
 * The admin-panel shell — a **floating** layout: the whole app sits on a soft `--tz-color-background`
 * canvas, with a rounded, elevated `--tz-color-surface` **sidebar card** (`logo` + auto-generated `Sidebar` + an optional
 * `sidebarFooter`) beside the header + content. Set it as the root route's component and pass
 * `<Outlet />` as `children`; the `Sidebar` builds itself from the routes' `staticData`. The header
 * holds an optional `ThemeToggle` (on by default), a **Settings** button (opens a right-side drawer to
 * pick + persist the `accent` color), plus an account `Avatar` whose menu has a **Sign out** item when
 * `header.onLogout` is given. The content area stacks
 * **`Breadcrumbs` → the page title (the active route's `staticData.name`) → `children`**; pages wrap
 * their own body in `PageLayout`. Set `header.pageTitle = false` to drop the auto `h2` when pages
 * carry their own heading inside their `PageLayout` header. A `<Toaster>` is **mounted by default** so
 * `toast.*()` works app-wide with no extra setup (configure via `toaster`, or `toaster={false}` to opt
 * out). Styling is token-based, so it follows the active `ConfigProvider` mode. Requires
 * `@tanstack/react-router` (peer).
 */
export function RootLayout({
  logo,
  sidebarFooter,
  header,
  toaster = true,
  children,
}: RootLayoutProps) {
  const title = usePageTitle()
  // header sticky/static — the user's persisted choice (seeded from config.header.sticky)
  const { headerSticky } = useTheme()
  const { language, setLanguage, languages } = useLanguage()
  const t = useT()
  // app-wide header config (config.header) as the base; this shell's `header` prop wins over it
  const configHeader = useHeaderConfig()
  const h: HeaderConfig = { ...configHeader, ...header }
  const showTheme = h.theme ?? true
  const showFullscreen = h.fullscreen ?? false
  const showSettings = h.settings ?? true
  const showSearch = h.search ?? true
  const showBreadcrumbs = h.breadcrumbs ?? true
  const toasterProps = typeof toaster === 'object' ? toaster : undefined
  const showPageTitle = h.pageTitle ?? true
  const onLogout = h.onLogout
  const user = h.user
  const [collapsed, setCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className={clsx(styles.shell, collapsed && styles.shellCollapsed)}>
      <aside className={styles.sidebar}>
        {logo ? <div className={styles.brand}>{logo}</div> : null}
        <div className={styles.navScroll}>
          <Sidebar />
        </div>
        {sidebarFooter ? <div className={styles.sidebarFooter}>{sidebarFooter}</div> : null}
      </aside>
      <div className={styles.main}>
        <header className={clsx(styles.topbar, headerSticky && styles.topbarSticky)}>
          <div className={styles.headerStart}>
            <IconButton
              aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
              aria-expanded={!collapsed}
              variant="filled"
              size="sm"
              onClick={() => setCollapsed((c) => !c)}
            >
              <Icon name="Menu" />
            </IconButton>
            {showSearch ? <NavSearch /> : null}
          </div>
          <div className={styles.headerEnd}>
            {showFullscreen ? <FullscreenToggle variant="filled" size="sm" /> : null}
            {showTheme ? <ThemeToggle variant="filled" size="sm" /> : null}
            {languages.length > 1 ? (
              <Dropdown
                placement="bottom-end"
                trigger={
                  <IconButton variant="filled" size="sm" aria-label={t('language.label')}>
                    <Icon name="Global" />
                  </IconButton>
                }
              >
                {languages.map((l) => (
                  <ListItem
                    key={l.code}
                    clickable
                    selected={l.code === language}
                    onClick={() => setLanguage(l.code)}
                    icon={<Flag code={l.code} />}
                  >
                    {l.label ?? l.code}
                  </ListItem>
                ))}
              </Dropdown>
            ) : null}
            {showSettings ? (
              <IconButton
                aria-label={t('settings.label')}
                variant="text"
                size="sm"
                className={styles.settings}
                onClick={() => setSettingsOpen(true)}
              >
                <Icon name="Setting5" />
              </IconButton>
            ) : null}
            {onLogout ? (
              <Dropdown
                placement="bottom-end"
                trigger={
                  <button type="button" className={styles.account} aria-label={t('account.label')}>
                    <Avatar size="md" name={user?.name} src={user?.avatar} color="primary" />
                  </button>
                }
              >
                {user ? (
                  <>
                    <Row gap={8} align="center" padding="var(--tz-space-xxs) var(--tz-space-sm)">
                      <Avatar size="sm" name={user.name} src={user.avatar} color="primary" />
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
                  {t('userCard.signOut')}
                </ListItem>
              </Dropdown>
            ) : null}
          </div>
        </header>
        <main className={styles.content}>
          {showBreadcrumbs ? <Breadcrumbs /> : null}
          {showPageTitle && title ? (
            <Typography variant="h2" className={styles.pageTitle}>
              {title}
            </Typography>
          ) : null}
          {children}
        </main>
      </div>
      {toaster !== false && <Toaster {...toasterProps} />}
      {showSettings ? (
        <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      ) : null}
    </div>
  )
}
