import { Link, type LinkProps } from '@tanstack/react-router'
import { Icon } from '../Icon'
import { useBreadcrumbs } from '../Sidebar/Sidebar'
import styles from './Breadcrumbs.module.css'

const linkTo = (to: string) => to as LinkProps['to']

/**
 * Auto-generated breadcrumb trail for the current route, rendered at the top of `RootLayout`'s
 * content. It always starts with a home icon that links to the first allowed menu page (the same
 * target as `FirstRouteRedirect`), followed by one crumb per matched route that declares a
 * `staticData.name`. Intermediate crumbs link to their page when navigable; the current page is
 * plain text. Renders nothing when the current route has no named matches. Token-only styling.
 */
export function Breadcrumbs() {
  const { homeTo, items } = useBreadcrumbs()
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
      <ol className={styles.list}>
        <li className={styles.item}>
          {homeTo ? (
            <Link to={linkTo(homeTo)} className={styles.home} aria-label="Home">
              <Icon name="Home2" size="sm" />
            </Link>
          ) : (
            <span className={styles.home} aria-label="Home">
              <Icon name="Home2" size="sm" />
            </span>
          )}
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li className={styles.item} key={`${item.label}-${index}`}>
              <Icon name="ArrowRight2" size="sm" className={styles.separator} />
              {item.to && !isLast ? (
                <Link to={linkTo(item.to)} className={styles.link}>
                  {item.label}
                </Link>
              ) : (
                <span className={styles.current} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
