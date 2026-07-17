import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'
import { useStepQueryKey, type ThemeColor } from '../../theme'
import { ICON_NAMES, type IconName } from '../../icons/names'
import { Icon } from '../Icon'
import styles from './Stepper.module.css'

const ICON_NAME_SET = new Set<string>(ICON_NAMES)

export type StepperOrientation = 'horizontal' | 'vertical'
export type StepperSize = 'sm' | 'md' | 'lg'

export interface StepItem {
  /** Step label. */
  label?: ReactNode
  /** Muted secondary line under the label. */
  description?: ReactNode
  /** Muted caption under the label (e.g. `"Optional"`). */
  optional?: ReactNode
  /** Override the step's number indicator with an icon — a known `IconName` or any node. */
  icon?: IconName | ReactNode
  /** Force the **completed** look regardless of the active step (e.g. an already-saved step). */
  completed?: boolean
  /** Marks the step **invalid** — a red indicator + label (e.g. its form section failed validation). */
  error?: boolean
  /** Disables the step — dimmed, (when clickable) not selectable, and skipped by the URL restore. */
  disabled?: boolean
  /**
   * Panel content rendered while this step is active — **below the strip** in horizontal mode, and
   * **inline under the step** (indented beside the rail) in vertical mode. Optional.
   */
  content?: ReactNode
}

export interface StepperProps {
  /** The steps, in order. */
  steps: StepItem[]
  /**
   * Controlled current step index (**0-based**). Steps before it read **completed**, the one at it is
   * **active**, and those after it are **upcoming**. Omit for uncontrolled (see `defaultStep`).
   */
  activeStep?: number
  /**
   * Initial step index (uncontrolled). Falls back to the URL query (when URL sync is active and the
   * param is present) and otherwise the first enabled step.
   */
  defaultStep?: number
  /**
   * Fires with the next step index whenever the stepper itself changes the step — a clicked step head,
   * or a Back/Forward `popstate` restore. In controlled mode apply it to your `activeStep` state.
   */
  onStepChange?: (index: number) => void
  /**
   * **Opt-in** URL sync — **off by default** (the URL is never touched when omitted). Pass the bare
   * prop (**`queryKey`** / `true`) to sync the active step under the configured `keys.stepQueryKey`
   * (else `'step'`), or a **string** for a custom param name. The URL value is **1-based**
   * (`?step=2` = index 1) and a page refresh restores it. Two synced steppers on one page need
   * distinct keys.
   */
  queryKey?: boolean | string
  /**
   * Push a history entry on each step change, so the browser **Back** button returns to the previous
   * step. Defaults to `false` — step changes **replace** the URL, so Back leaves the page instead of
   * stepping back through the wizard (and `popstate` still restores a step when one is in the query).
   */
  pushHistory?: boolean
  /**
   * Layout direction. `horizontal` (default) centers each label **under** its circle and **scrolls
   * sideways** when the steps don't fit (so it fits a phone as-is); `vertical` stacks the steps along
   * a rail connector.
   */
  orientation?: StepperOrientation
  /** Preset size. Defaults to `'md'`. */
  size?: StepperSize
  /** Theme palette token tinting the active / completed steps. Defaults to `'primary'`. */
  color?: ThemeColor
  /**
   * Makes steps **clickable** — each step head becomes a `<button>` that fires this with the step index
   * (a `disabled` step never fires); an uncontrolled stepper also selects the clicked step itself. Omit
   * for a display-only progress indicator.
   */
  onStepClick?: (index: number) => void
  /** Accessible label for the stepper list. */
  'aria-label'?: string
  className?: string
  style?: CSSProperties
}

/**
 * A step progress indicator. Data-driven via `steps` (each: `label`, `description`, `optional`, `icon`,
 * `completed`, `error`, `disabled`, `content`) — controlled (`activeStep`, 0-based) or uncontrolled
 * (`defaultStep`). **Opt-in URL sync:** pass **`queryKey`** (bare/`true` = the configured
 * `keys.stepQueryKey`, else `'step'`; or a custom string) and the active step syncs to that query param
 * (**1-based** — `?step=2`) so a refresh restores it; with no `queryKey` the URL is never touched.
 * Synced step changes **replace** the URL (Back doesn't walk the wizard); pass **`pushHistory`** to
 * step back with Back.
 * Horizontal (labels centered under the circles) or `vertical` (a rail); when the horizontal steps
 * don't fit, the strip **scrolls sideways** (scrollbar hidden, the active step kept in view) — so it
 * fits a phone as-is. The active step's **`content`** renders below the strip (horizontal) or inline
 * under the step (vertical). Pass **`onStepClick`** to make the steps navigable. Tinted by `color` via
 * the shared `--tz-btn-rgb` pattern; the list is an `<ol>` with `aria-current="step"` on the active step.
 */
export const Stepper = forwardRef<HTMLDivElement, StepperProps>(function Stepper(
  {
    steps,
    activeStep,
    defaultStep,
    onStepChange,
    queryKey,
    pushHistory = false,
    orientation = 'horizontal',
    size = 'md',
    color = 'primary',
    onStepClick,
    'aria-label': ariaLabel,
    className,
    style,
  },
  ref,
) {
  const vertical = orientation === 'vertical'
  const clickable = onStepClick != null

  // resolve the URL-sync key — OPT-IN: omitted/false = no sync (URL untouched); the bare/`true` form
  // uses the configured default (`keys.stepQueryKey`, else 'step'); a string is a custom param name
  const stepQueryKey = useStepQueryKey()
  const syncKey = queryKey === true ? stepQueryKey : queryKey || undefined

  const isSelectable = useCallback(
    (i: number | null | undefined): i is number =>
      i != null && Number.isInteger(i) && i >= 0 && i < steps.length && !steps[i].disabled,
    [steps],
  )

  // the URL carries the step 1-based (`?step=2` = index 1) — human-friendly, like Table's page param
  const readQuery = useCallback((): number | null => {
    if (!syncKey || typeof window === 'undefined') return null
    const raw = new URLSearchParams(window.location.search).get(syncKey)
    return raw != null && /^\d+$/.test(raw) ? Number(raw) - 1 : null
  }, [syncKey])

  const firstEnabled = Math.max(
    steps.findIndex((s) => !s.disabled),
    0,
  )

  const [internal, setInternal] = useState<number>(() => {
    const q = readQuery()
    if (isSelectable(q)) return q
    return isSelectable(defaultStep) ? defaultStep : firstEnabled
  })
  const isControlled = activeStep !== undefined
  // controlled mode renders the given index verbatim (even past the last step — the "all completed"
  // pattern); only the URL/popstate restores are gated by `isSelectable`
  const active = isControlled ? activeStep : internal

  // keep the latest active / onStepChange / push-intent for the stable effects + popstate listener
  const activeRef = useRef(active)
  activeRef.current = active
  const onStepChangeRef = useRef(onStepChange)
  onStepChangeRef.current = onStepChange
  const pushIntent = useRef(false)

  const writeQuery = useCallback(
    (next: number, push: boolean) => {
      if (!syncKey || typeof window === 'undefined') return
      const params = new URLSearchParams(window.location.search)
      const value = String(next + 1)
      if (params.get(syncKey) === value) return
      params.set(syncKey, value)
      const url = `${window.location.pathname}?${params.toString()}${window.location.hash}`
      window.history[push ? 'pushState' : 'replaceState'](window.history.state, '', url)
    },
    [syncKey],
  )

  const select = (next: number) => {
    if (next === activeRef.current) return
    pushIntent.current = true
    if (!isControlled) setInternal(next)
    onStepChange?.(next)
  }

  // mirror the active step into the URL whenever it changes (and on mount = canonicalize). A
  // user-driven change `push`es when `pushHistory`; programmatic / popstate changes just `replace`.
  useEffect(() => {
    if (!syncKey || typeof window === 'undefined') return
    // an out-of-range active (e.g. `steps.length` = "all done") isn't a step — leave the URL alone
    if (!Number.isInteger(active) || active < 0 || active >= steps.length) return
    const push = pushIntent.current && pushHistory
    pushIntent.current = false
    writeQuery(active, push)
  }, [syncKey, active, pushHistory, writeQuery, steps.length])

  // Back/Forward → restore the step from the query
  useEffect(() => {
    if (!syncKey || typeof window === 'undefined') return
    const onPopState = () => {
      const q = readQuery()
      if (isSelectable(q) && q !== activeRef.current) {
        if (activeStep === undefined) setInternal(q)
        onStepChangeRef.current?.(q)
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [syncKey, readQuery, isSelectable, activeStep])

  const activeContent = steps[active]?.content

  // when the horizontal strip overflows (scrolls sideways), keep the active step in view — by moving
  // the strip's own scrollLeft only. (scrollIntoView would also scroll every scrollable ancestor —
  // i.e. the page itself — yanking the viewport down to the stepper on mount.)
  const listRef = useRef<HTMLOListElement | null>(null)
  useEffect(() => {
    if (orientation === 'vertical') return // the vertical rail never scrolls sideways
    const list = listRef.current
    const el = list?.children[active] as HTMLElement | undefined
    if (!list || !el) return
    const listRect = list.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const left = elRect.left - listRect.left + list.scrollLeft
    const right = left + elRect.width
    if (left < list.scrollLeft) list.scrollLeft = left
    else if (right > list.scrollLeft + list.clientWidth) list.scrollLeft = right - list.clientWidth
  }, [active, orientation])

  const renderIcon = (icon: StepItem['icon']) =>
    typeof icon === 'string' && ICON_NAME_SET.has(icon) ? (
      <Icon name={icon as IconName} size={size} />
    ) : (
      icon
    )

  return (
    <div
      ref={ref}
      className={clsx(styles.root, styles[orientation], styles[size], className)}
      style={
        {
          '--tz-btn-rgb': `var(--tz-color-${color}-rgb)`,
          '--tz-btn-on': `var(--tz-color-${color}-contrast, #fff)`,
          ...style,
        } as CSSProperties
      }
    >
      <ol ref={listRef} aria-label={ariaLabel} className={styles.list}>
        {steps.map((step, i) => {
          const isError = !!step.error
          const isCompleted = !isError && (step.completed || i < active)
          const isActive = !isError && !isCompleted && i === active
          const state = isError
            ? 'error'
            : isCompleted
              ? 'completed'
              : isActive
                ? 'active'
                : 'upcoming'
          const isLast = i === steps.length - 1

          const icon = renderIcon(step.icon)
          const indicator =
            icon != null ? (
              icon
            ) : isCompleted ? (
              <Icon name="Check" size={size} />
            ) : (
              <span className={styles.number}>{i + 1}</span>
            )

          const hasText = step.label != null || step.description != null || step.optional != null
          const head = (
            <>
              <span
                className={styles.indicator}
                aria-hidden={icon == null && !isCompleted ? undefined : true}
              >
                {indicator}
              </span>
              {hasText && (
                <span className={styles.text}>
                  {step.label != null && <span className={styles.label}>{step.label}</span>}
                  {step.description != null && (
                    <span className={styles.description}>{step.description}</span>
                  )}
                  {step.optional != null && (
                    <span className={styles.optional}>{step.optional}</span>
                  )}
                </span>
              )}
            </>
          )

          return (
            <li
              key={i}
              className={clsx(styles.step, styles[state], step.disabled && styles.disabled)}
            >
              {clickable ? (
                <button
                  type="button"
                  className={styles.main}
                  disabled={step.disabled}
                  aria-current={isActive ? 'step' : undefined}
                  onClick={() => {
                    onStepClick?.(i)
                    select(i)
                  }}
                >
                  {head}
                </button>
              ) : (
                <div className={styles.main} aria-current={isActive ? 'step' : undefined}>
                  {head}
                </div>
              )}
              {!isLast && (
                <span
                  className={clsx(styles.connector, i < active && styles.done)}
                  aria-hidden="true"
                />
              )}
              {/* vertical: the active step's content sits inline, indented beside the rail */}
              {vertical && i === active && step.content != null && (
                <div className={styles.stepContent}>{step.content}</div>
              )}
            </li>
          )
        })}
      </ol>
      {/* horizontal: the active step's content renders as a panel below the strip */}
      {!vertical && activeContent != null && <div className={styles.panel}>{activeContent}</div>}
    </div>
  )
})
