import { forwardRef, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { clsx } from 'clsx'
import type { ThemeColor } from '../../theme'
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
  /** Force the **completed** look regardless of `activeStep` (e.g. an already-saved step). */
  completed?: boolean
  /** Marks the step **invalid** — a red indicator + label (e.g. its form section failed validation). */
  error?: boolean
  /** Disables the step — dimmed, and (when clickable) not selectable. */
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
   * Current step index (**0-based**). Steps before it read **completed**, the one at it is **active**,
   * and those after it are **upcoming**. Defaults to `0`.
   */
  activeStep?: number
  /**
   * Layout direction. `horizontal` (default) centers each label **under** its circle and **scrolls
   * sideways** when the steps don't fit (so it fits a phone as-is); `vertical` stacks the steps along
   * a rail connector.
   */
  orientation?: StepperOrientation
  /** Preset size. Defaults to `'md'`. */
  size?: StepperSize
  /** Brand token tinting the active / completed steps. Defaults to `'primary'`. */
  color?: ThemeColor
  /**
   * Makes steps **clickable** — each step head becomes a `<button>` that fires this with the step index
   * (a `disabled` step never fires). Omit for a display-only progress indicator.
   */
  onStepClick?: (index: number) => void
  /** Accessible label for the stepper list. */
  'aria-label'?: string
  className?: string
  style?: CSSProperties
}

/**
 * A step progress indicator. Data-driven via `steps` (each: `label`, `description`, `optional`, `icon`,
 * `completed`, `error`, `disabled`, `content`) with a controlled `activeStep` (0-based). Horizontal
 * (labels centered under the circles) or `vertical` (a rail); when the horizontal steps don't fit, the
 * strip **scrolls sideways** (scrollbar hidden, the active step kept in view) — so it fits a phone
 * as-is. The active step's **`content`** renders below the strip (horizontal) or inline under the step
 * (vertical). Pass **`onStepClick`** to make the steps navigable. Tinted by `color` via the shared
 * `--tz-btn-rgb` pattern; the list is an `<ol>` with `aria-current="step"` on the active step.
 */
export const Stepper = forwardRef<HTMLDivElement, StepperProps>(function Stepper(
  {
    steps,
    activeStep = 0,
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
  const activeContent = steps[activeStep]?.content

  // when the horizontal strip overflows (scrolls sideways), keep the active step in view
  const listRef = useRef<HTMLOListElement | null>(null)
  useEffect(() => {
    listRef.current?.children[activeStep]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [activeStep])

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
          const isCompleted = !isError && (step.completed || i < activeStep)
          const isActive = !isError && !isCompleted && i === activeStep
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
                  onClick={() => onStepClick?.(i)}
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
                  className={clsx(styles.connector, i < activeStep && styles.done)}
                  aria-hidden="true"
                />
              )}
              {/* vertical: the active step's content sits inline, indented beside the rail */}
              {vertical && i === activeStep && step.content != null && (
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
