import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { useFormContext } from '../../form/formContext'
import { useFloatingPanel } from '../../hooks/useFloatingPanel'
import { ICON_NAMES, type IconName } from '../../icons/names'
import { Icon } from '../Icon'
import { List, ListItem } from '../List'
import { Typography } from '../Typography'
import styles from './Select.module.css'

const ICON_NAME_SET = new Set<string>(ICON_NAMES)

export type SelectSize = 'sm' | 'md' | 'lg'

/** A single selectable option. */
export interface SelectOption {
  /** The value committed when this option is chosen. */
  value: string
  /** Display + search text. */
  label: string
  /** Greys out and blocks selecting this option. */
  disabled?: boolean
  /** Leading icon — a known `IconName` (rendered as `<Icon>`) or any node. */
  icon?: IconName | ReactNode
}

/** Renders an option's icon (an `IconName` becomes an `<Icon>`; anything else is used as-is). */
function renderIcon(icon: IconName | ReactNode, size: 'sm' | 'md'): ReactNode {
  if (icon == null) return null
  if (typeof icon === 'string' && ICON_NAME_SET.has(icon))
    return <Icon name={icon as IconName} size={size} />
  return icon
}

export interface SelectProps {
  /** Label rendered above the field. */
  label?: ReactNode
  /** The selectable options. */
  options: SelectOption[]
  /** Preset size — control height, font and option density. */
  size?: SelectSize
  /** Marks the field invalid: red border/ring + the `helperText` in the error color. */
  error?: boolean
  /** Helper / validation text under the field. Adopts the error color while `error`. */
  helperText?: ReactNode
  /** Adds a red asterisk after the label. */
  required?: boolean
  /** Stretches the field to fill its container width. Defaults to `true`. */
  fullWidth?: boolean
  /** Disables the field. */
  disabled?: boolean
  /** Controlled value — the chosen option's `value` (`''` = nothing selected). */
  value?: string
  /** Initial value for uncontrolled use. */
  defaultValue?: string
  /** Fires with the next value (`''` when cleared). */
  onChange?: (value: string) => void
  /** Text shown in the trigger when nothing is selected. Defaults to `"Select…"`. */
  placeholder?: string
  /** Shows a clear (×) button in the trigger when a value is set. */
  clearable?: boolean
  /** Adds a search box inside the popover that filters options by label. */
  searchable?: boolean
  /** Placeholder for the search box. Defaults to `"Search…"`. */
  searchPlaceholder?: string
  /** Shown in the popover when no option matches. Defaults to `"No options"`. */
  noOptionsText?: ReactNode
  /** Form field name — auto-binds to a surrounding `<Form>` (value is the option's `value`). */
  name?: string
  /** Id for the trigger (label association). */
  id?: string
  className?: string
  style?: CSSProperties
}

/**
 * A labeled single-select. The trigger reuses TextField-style chrome (label, helper/error, sizes,
 * `required`, `fullWidth`, `disabled`); clicking it opens a `Dropdown`-style popover — portaled to
 * `<body>`, opening below (flipping above only when it would overflow), locking page scroll,
 * re-positioning on scroll/resize, matching the trigger width, and entering with the shared
 * opacity + translate animation. Options render as `ListItem`s in a `role="listbox"`; the chosen
 * option is highlighted with a tick, disabled options are inert. Full keyboard support
 * (Arrow/Home/End to move, Enter/Space to select, Escape to close, type-ahead) and ARIA
 * (`listbox`/`option`, `aria-activedescendant`, `aria-expanded`). Optionally `searchable` (a filter
 * box) and `clearable` (a × to reset). Controlled (`value` + `onChange`) or uncontrolled
 * (`defaultValue`), and binds to a surrounding `<Form>` by `name` (value = the option's `value`;
 * validate with e.g. `z.string().min(1, 'Required')`). Token-only styling.
 */
export const Select = forwardRef<HTMLDivElement, SelectProps>(function Select(
  {
    label,
    options,
    size = 'md',
    error,
    helperText,
    required = false,
    fullWidth = true,
    disabled = false,
    value,
    defaultValue,
    onChange,
    placeholder = 'Select…',
    clearable = false,
    searchable = false,
    searchPlaceholder = 'Search…',
    noOptionsText = 'No options',
    name,
    id: idProp,
    className,
    style,
  },
  ref,
) {
  const reactId = useId()
  const id = idProp ?? reactId
  const labelId = `${id}-label`
  const listboxId = `${id}-listbox`
  const helperId = `${id}-helper`
  const optionId = (index: number) => `${id}-opt-${index}`

  // ── value (controlled / form-bound / uncontrolled) ─────────────────────────────────────────────
  const form = useFormContext()
  const isFormBound = Boolean(form && name)
  const bound = isFormBound ? form!.field(name!) : undefined
  const externalValue =
    value !== undefined
      ? value
      : isFormBound
        ? ((form!.values[name!] as string | undefined) ?? '')
        : undefined
  const isControlled = value !== undefined || isFormBound
  const [internal, setInternal] = useState<string>(defaultValue ?? '')
  const currentValue = isControlled ? externalValue! : internal

  const resolvedError = error ?? bound?.error ?? false
  const resolvedHelperText = helperText ?? bound?.helperText

  const selected = options.find((o) => o.value === currentValue)
  const hasValue = selected != null

  const commit = (next: string) => {
    if (!isControlled) setInternal(next)
    if (isFormBound) form!.setValue(name!, next)
    onChange?.(next)
  }

  // ── popover open state ─────────────────────────────────────────────────────────────────────────
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const typeahead = useRef({ buffer: '', timer: 0 })
  // stable handle to the form field's blur (touched) callback — field() returns a fresh object each render
  const fieldBlur = useRef<(() => void) | undefined>(undefined)
  fieldBlur.current = bound ? () => bound.onBlur({} as FocusEvent<HTMLInputElement>) : undefined
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const setTriggerRef = useCallback(
    (node: HTMLDivElement | null) => {
      triggerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as { current: HTMLDivElement | null }).current = node
    },
    [ref],
  )

  // options shown right now (filtered by the search box, if any)
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return options
    const q = searchQuery.trim().toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [searchable, searchQuery, options])

  const findEnabled = useCallback(
    (start: number, delta: number) => {
      let i = start
      while (i >= 0 && i < filteredOptions.length) {
        if (!filteredOptions[i].disabled) return i
        i += delta
      }
      return -1
    },
    [filteredOptions],
  )

  // single dismiss path: clears search + type-ahead buffer, marks the field touched, optionally refocuses
  const closeMenu = useCallback((refocus: boolean) => {
    setOpen(false)
    setSearchQuery('')
    window.clearTimeout(typeahead.current.timer)
    typeahead.current.buffer = ''
    fieldBlur.current?.()
    if (refocus) triggerRef.current?.focus()
  }, [])

  // portal positioning, scroll-lock, outside/Escape dismiss — shared with MultiSelect
  const {
    popoverRef,
    position: pos,
    visible,
  } = useFloatingPanel({
    open,
    triggerRef,
    onClose: closeMenu,
  })

  // on open: highlight the selected option (or first enabled), focus the search box if searchable
  useEffect(() => {
    if (!open) return
    const selIdx = filteredOptions.findIndex((o) => o.value === currentValue)
    setHighlightedIndex(
      selIdx >= 0 && !filteredOptions[selIdx].disabled ? selIdx : findEnabled(0, 1),
    )
    if (searchable) requestAnimationFrame(() => searchInputRef.current?.focus())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // keep the highlighted option scrolled into view
  useEffect(() => {
    if (!open || highlightedIndex < 0) return
    document.getElementById(optionId(highlightedIndex))?.scrollIntoView?.({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, highlightedIndex])

  // when the search filter changes, re-anchor the highlight to the first match
  useEffect(() => {
    if (open && searchable) setHighlightedIndex(findEnabled(0, 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // if the option count changes while open (async load / list shrink), keep the highlight in range
  useEffect(() => {
    if (open) setHighlightedIndex((i) => (i < filteredOptions.length ? i : findEnabled(0, 1)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredOptions.length])

  const openMenu = () => {
    if (!disabled) setOpen(true)
  }
  const selectOption = (opt: SelectOption | undefined) => {
    if (!opt || opt.disabled) return
    commit(opt.value)
    closeMenu(true)
  }
  const moveHighlight = (delta: number) => {
    setHighlightedIndex((cur) => {
      const start = cur < 0 ? (delta > 0 ? 0 : filteredOptions.length - 1) : cur + delta
      const found = findEnabled(start, delta)
      return found === -1 ? cur : found
    })
  }

  // type-ahead (non-searchable): jump to the option whose label starts with the typed buffer
  const handleTypeahead = (char: string) => {
    const t = typeahead.current
    window.clearTimeout(t.timer)
    t.buffer += char.toLowerCase()
    t.timer = window.setTimeout(() => (t.buffer = ''), 500)
    const match = filteredOptions.findIndex(
      (o) => !o.disabled && o.label.toLowerCase().startsWith(t.buffer),
    )
    if (match >= 0) setHighlightedIndex(match)
  }

  const handleKeyDown = (event: ReactKeyboardEvent) => {
    if (disabled) return
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        open ? moveHighlight(1) : openMenu()
        break
      case 'ArrowUp':
        event.preventDefault()
        open ? moveHighlight(-1) : openMenu()
        break
      case 'Enter':
        event.preventDefault()
        if (!open) openMenu()
        else selectOption(filteredOptions[highlightedIndex])
        break
      case ' ':
        // Space opens a closed menu (any mode); selects only when open & not searchable
        // (so a focused search box can still type spaces)
        if (!open) {
          event.preventDefault()
          openMenu()
        } else if (!searchable) {
          event.preventDefault()
          selectOption(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        if (open) {
          event.preventDefault()
          closeMenu(true)
        }
        break
      case 'Tab':
        if (open) closeMenu(false)
        break
      case 'Home':
        if (open) {
          event.preventDefault()
          setHighlightedIndex(findEnabled(0, 1))
        }
        break
      case 'End':
        if (open) {
          event.preventDefault()
          setHighlightedIndex(findEnabled(filteredOptions.length - 1, -1))
        }
        break
      default:
        if (
          !searchable &&
          open &&
          event.key.length === 1 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey
        ) {
          handleTypeahead(event.key)
        }
    }
  }

  const handleTriggerBlur = (event: FocusEvent<HTMLDivElement>) => {
    // mark the form field touched only when focus leaves the whole widget (not into the popover)
    const next = event.relatedTarget as Node | null
    if (next && (popoverRef.current?.contains(next) || triggerRef.current?.contains(next))) return
    bound?.onBlur(event as unknown as FocusEvent<HTMLInputElement>)
  }

  const handleClear = (event: ReactMouseEvent) => {
    event.stopPropagation()
    commit('')
    triggerRef.current?.focus()
  }

  const activeId = open && highlightedIndex >= 0 ? optionId(highlightedIndex) : undefined
  const iconSize: 'sm' | 'md' = size === 'sm' ? 'sm' : 'md'
  // chevron size per field size: sm 16 · md 14 · lg 12
  const chevronPx = size === 'sm' ? 16 : size === 'md' ? 14 : 12

  return (
    <div
      className={clsx(
        styles.field,
        styles[size],
        fullWidth && styles.fullWidth,
        resolvedError && styles.error,
        disabled && styles.disabled,
        className,
      )}
      style={style}
    >
      {label != null && (
        <span
          id={labelId}
          className={styles.label}
          onClick={() => !disabled && triggerRef.current?.focus()}
        >
          <Typography as="span" variant="bodySmall" color="muted">
            {label}
          </Typography>
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </span>
      )}

      <div
        ref={setTriggerRef}
        id={id}
        // `name` lets the form's scroll-to-error find + focus this field
        {...(name ? { name } : {})}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={searchable ? undefined : activeId}
        aria-labelledby={label != null ? labelId : undefined}
        aria-disabled={disabled || undefined}
        aria-required={required || undefined}
        aria-invalid={resolvedError || undefined}
        aria-describedby={resolvedHelperText != null ? helperId : undefined}
        className={clsx(styles.control, open && styles.open)}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={handleKeyDown}
        onBlur={handleTriggerBlur}
      >
        <span className={clsx(styles.value, !hasValue && styles.placeholder)}>
          {selected?.icon != null && (
            <span className={styles.valueIcon}>{renderIcon(selected.icon, iconSize)}</span>
          )}
          <span className={styles.valueLabel}>{selected ? selected.label : placeholder}</span>
        </span>

        {clearable && currentValue !== '' && !disabled && (
          <button
            type="button"
            className={styles.clear}
            aria-label="Clear selection"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClear}
          >
            <Icon name="CloseCircle" size="sm" />
          </button>
        )}

        <Icon
          name="ArrowDown4"
          className={styles.chevron}
          style={{ width: chevronPx, height: chevronPx }}
          aria-hidden="true"
        />
      </div>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className={styles.popover}
            data-open={visible ? 'true' : 'false'}
            data-side={pos?.side ?? 'bottom'}
            style={
              {
                position: 'fixed',
                top: pos?.top ?? 0,
                left: pos?.left ?? 0,
                width: pos?.width,
                maxHeight: pos?.maxHeight,
                visibility: pos ? 'visible' : 'hidden',
              } as CSSProperties
            }
          >
            {searchable && (
              <div className={styles.search}>
                <Icon
                  name="SearchNormal"
                  size="sm"
                  className={styles.searchIcon}
                  aria-hidden="true"
                />
                <input
                  ref={searchInputRef}
                  className={styles.searchInput}
                  type="text"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listboxId}
                  aria-activedescendant={activeId}
                  aria-autocomplete="list"
                  aria-label={searchPlaceholder}
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  spellCheck={false}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            )}

            {/* the listbox always carries `listboxId` (even when empty) so aria-controls never dangles */}
            <List
              role="listbox"
              id={listboxId}
              aria-labelledby={label != null ? labelId : undefined}
              size={size}
              className={styles.listbox}
            >
              {filteredOptions.length === 0 ? (
                <div className={styles.noOptions}>
                  <Typography as="span" variant="bodySmall" color="muted">
                    {noOptionsText}
                  </Typography>
                </div>
              ) : (
                filteredOptions.map((opt, index) => {
                  const isSelected = opt.value === currentValue
                  return (
                    <ListItem
                      key={opt.value}
                      id={optionId(index)}
                      role="option"
                      tabIndex={-1}
                      aria-selected={isSelected}
                      aria-current={undefined}
                      clickable
                      selected={isSelected}
                      disabled={opt.disabled}
                      icon={opt.icon}
                      className={clsx(index === highlightedIndex && styles.active)}
                      trailing={isSelected ? <Icon name="TickCircle" size="sm" /> : undefined}
                      onMouseEnter={() => !opt.disabled && setHighlightedIndex(index)}
                      onClick={() => selectOption(opt)}
                    >
                      {opt.label}
                    </ListItem>
                  )
                })
              )}
            </List>
          </div>,
          document.body,
        )}

      {resolvedHelperText != null && (
        <Typography
          as="span"
          id={helperId}
          variant="bodySmall"
          color={resolvedError ? 'error' : 'muted'}
          className={styles.helper}
        >
          {resolvedHelperText}
        </Typography>
      )}
    </div>
  )
})
