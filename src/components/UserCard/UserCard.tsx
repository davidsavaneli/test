import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import type { ThemeColor } from '../../theme'
import type { IconName } from '../../icons/names'
import { Avatar } from '../Avatar'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { Typography } from '../Typography'
import styles from './UserCard.module.css'

export type UserCardSize = 'sm' | 'md' | 'lg'

export interface UserCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** Display name — the primary line, and the source of the avatar initials. */
  name?: string
  /** Secondary line under the name (usually the email). */
  email?: ReactNode
  /** Avatar image URL (falls back to the initials from `name`, else the `icon`). */
  avatar?: string
  /** Fallback avatar icon when there's no image or name. Defaults to `'User'`. */
  icon?: IconName
  /** Theme palette token tinting the avatar. Defaults to `'primary'`. */
  color?: ThemeColor
  /** Preset size (avatar + fonts + button). Defaults to `'md'`. */
  size?: UserCardSize
  /** When provided, a **Sign out** button is shown that calls this. */
  onLogout?: () => void
  /** Sign-out button label. Defaults to `'Sign out'`. */
  logoutLabel?: ReactNode
  /** Extra content between the identity row and the sign-out button (e.g. a link or menu). */
  children?: ReactNode
}

/**
 * A compact account card — an `Avatar` + name/email and an optional **Sign out** button. Drop it into
 * the `RootLayout` `sidebarFooter` (or anywhere) for a consistent signed-in-user block across apps,
 * instead of hand-rolling the markup each time. Shows the image (`avatar`) → initials (from `name`) →
 * `icon` (default `User`) in priority order; renders the sign-out `Button` (outlined `error`) only when
 * `onLogout` is given. `size` (`sm`/`md`/`lg`) scales the avatar + type; `color` (default `primary`)
 * tints the avatar. Own CSS module (token-only).
 */
export const UserCard = forwardRef<HTMLDivElement, UserCardProps>(function UserCard(
  {
    name,
    email,
    avatar,
    icon = 'User',
    color = 'primary',
    size = 'md',
    onLogout,
    logoutLabel = 'Sign out',
    children,
    className,
    style,
    ...props
  },
  ref,
) {
  // the identity row + the sign-out button share the same visual size step
  const avatarSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'
  const buttonSize = size === 'lg' ? 'md' : 'sm'

  return (
    <div
      ref={ref}
      className={clsx(styles.card, styles[size], className)}
      style={style as CSSProperties}
      {...props}
    >
      <div className={styles.identity}>
        {/* Avatar priority is image → icon → initials, so pass `icon` only as the last resort (no
            name), otherwise a name would still show the icon instead of its initials */}
        <Avatar
          size={avatarSize}
          name={name}
          src={avatar}
          icon={name ? undefined : icon}
          color={color}
        />
        {(name != null || email != null) && (
          <div className={styles.text}>
            {name != null && (
              <Typography variant="bodySmall" truncate>
                {name}
              </Typography>
            )}
            {email != null && (
              <Typography variant="caption" color="muted" truncate>
                {email}
              </Typography>
            )}
          </div>
        )}
      </div>

      {children}

      {onLogout ? (
        <Button
          variant="outlined"
          color="error"
          size={buttonSize}
          fullWidth
          startIcon={<Icon name="Logout2" />}
          onClick={onLogout}
        >
          {logoutLabel}
        </Button>
      ) : null}
    </div>
  )
})
