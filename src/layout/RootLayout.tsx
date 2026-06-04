import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import './layout.css'

export interface RootLayoutProps {
  /** Logo + title area at the top of the sidebar. */
  brand?: ReactNode
  /** Left side of the header (e.g. page title / breadcrumbs). */
  headerStart?: ReactNode
  /** Right side of the header (e.g. `ThemeToggle`, user menu). */
  headerEnd?: ReactNode
  /** Routed content — the consumer passes `<Outlet />`. */
  children: ReactNode
}

/**
 * The admin-panel shell: a left sidebar (brand + auto-generated `Sidebar`), a top header, and a
 * content container. Set it as the root route's component and pass `<Outlet />` as `children`; the
 * `Sidebar` builds itself from the routes' `staticData`. Styling is token-based, so it follows the
 * active `ThemeProvider` mode. Requires `@tanstack/react-router` (peer).
 */
export function RootLayout({ brand, headerStart, headerEnd, children }: RootLayoutProps) {
  return (
    <div className="tz-shell">
      <aside className="tz-sidebar">
        {brand ? <div className="tz-brand">{brand}</div> : null}
        <Sidebar />
      </aside>
      <div className="tz-main">
        <header className="tz-topbar">
          <div className="tz-topbar__start">{headerStart}</div>
          <div className="tz-topbar__end">{headerEnd}</div>
        </header>
        <main className="tz-content">{children}</main>
      </div>
    </div>
  )
}
