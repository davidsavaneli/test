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
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { useFormContext } from '../../form/formContext'
import { useFloatingPanel } from '../../hooks/useFloatingPanel'
import type { ThemeColor } from '../../theme'
import { Chip } from '../Chip'
import { Icon } from '../Icon'
import { List, ListItem } from '../List'
import { Typography } from '../Typography'
import type { SelectOption, SelectSize } from '../Select'
import styles from './MultiSelect.module.css'

export interface MultiSelectProps {
  /** Label rendered above the field. */
  label?: ReactNode
  /** The selectable options. */
  options: SelectOption[]
  /** Preset size — control height, font, chips and option density. */
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
  /** Controlled value — the chosen options' `value`s. */
  value?: string[]
  /** Initial value for uncontrolled use. */
  defaultValue?: string[]
  /** Fires with the next array of selected values. */
  onChange?: (value: string[]) => void
  /** Text shown in the trigger when nothing is selected. Defaults to `"Select…"`. */
  placeholder?: string
  /** Brand token tinting the selected chips. Defaults to `medium`. */
  color?: ThemeColor
  /** Shows a clear (×) button in the trigger when anything is selected. */
  clearable?: boolean
  /** Adds a search box inside the popover that filters options by label. */
  searchable?: boolean
  /** Placeholder for the search box. Defaults to `"Search…"`. */
  searchPlaceholder?: string
  /** Shown in the popover when no option matches. Defaults to `"No options"`. */
  noOptionsText?: ReactNode
  /** Form field name — auto-binds to a surrounding `<Form>` (value is a `string[]`). */
  name?: string
  /** Id for the trigger (label association). */
  id?: string
  className?: string
  style?: CSSProperties
}

/**
 * A labeled multi-select — the `string[]` sibling of `Select`. The trigger shows the chosen options
 * as deletable `Chip`s (wrapping, growing like `TagsField`) or a placeholder; clicking it opens the
 * same `Dropdown`-style popover (portaled, flips, scroll-locked, trigger-width, animated — shared via
 * `useFloatingPanel`). Options render as `ListItem`s in a `role="listbox"` `aria-multiselectable`
 * list; selecting **toggles** an option and keeps the popover open, the chosen ones showing a tick.
 * Full keyboard support (Arrow/Home/End, Enter/Space to toggle, Escape to close, type-ahead) and
 * ARIA. Optionally `searchable` + `clearable`. Controlled (`value` + `onChange`) or uncontrolled
 * (`defaultValue`), and binds to a surrounding `<Form>` by `name` (value = `string[]`; validate with
 * e.g. `z.array(z.string()).min(1, 'Pick at least one')`). Token-only styling.
 */
export const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(function MultiSelect(
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
    color = 'medium',
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

  // ── value (controlled / form-bound / uncontrolled) — always a string[] ─────────────────────────
  // Read the RAW form value (field().value String-coerces, which would flatten the array).
  const form = useFormContext()
  const isFormBound = Boolean(form && name)
  const bound = isFormBound ? form!.field(name!) : undefined
  const externalValue =
    value !== undefined
      ? value
      : isFormBound
        ? ((form!.values[name!] as string[] | undefined) ?? [])
        : undefined
  const isControlled = value !== undefined || isFormBound
  const [internal, setInternal] = useState<string[]>(defaultValue ?? [])
  const selectedValues = isControlled ? externalValue! : internal

  const resolvedError = error ?? bound?.error ?? false
  const resolvedHelperText = helperText ?? bound?.helperText

  const commit = (next: string[]) => {
    if (!isControlled) setInternal(next)
    if (isFormBound) form!.setValue(name!, next)
    onChange?.(next)
  }

  // ── popover open state ─────────────────────────────────────────────────────────────────────────
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const typeahead = useRef({ buffer: '', timer: 0 })
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

  const closeMenu = useCallback((refocus: boolean) => {
    setOpen(false)
    setSearchQuery('')
    window.clearTimeout(typeahead.current.timer)
    typeahead.current.buffer = ''
    fieldBlur.current?.()
    if (refocus) triggerRef.current?.focus()
  }, [])

  const {
    popoverRef,
    position: pos,
    visible,
  } = useFloatingPanel({
    open,
    triggerRef,
    onClose: closeMenu,
  })

  // on open: highlight the first enabled option, focus the search box if searchable
  useEffect(() => {
    if (!open) return
    setHighlightedIndex(findEnabled(0, 1))
    if (searchable) requestAnimationFrame(() => searchInputRef.current?.focus())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open || highlightedIndex < 0) return
    document.getElementById(optionId(highlightedIndex))?.scrollIntoView?.({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, highlightedIndex])

  // search filter → re-anchor to the first match
  useEffect(() => {
    if (open && searchable) setHighlightedIndex(findEnabled(0, 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // keep the highlight in range if the option count changes while open
  useEffect(() => {
    if (open) setHighlightedIndex((i) => (i < filteredOptions.length ? i : findEnabled(0, 1)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredOptions.length])

  const openMenu = () => {
    if (!disabled) setOpen(true)
  }
  const toggleOption = (opt: SelectOption | undefined) => {
    if (!opt || opt.disabled) return
    commit(
      selectedValues.includes(opt.value)
        ? selectedValues.filter((v) => v !== opt.value)
        : [...selectedValues, opt.value],
    )
    // multi-select stays open
  }
  const removeValue = (v: string) => commit(selectedValues.filter((x) => x !== v))
  const moveHighlight = (delta: number) => {
    setHighlightedIndex((cur) => {
      const start = cur < 0 ? (delta > 0 ? 0 : filteredOptions.length - 1) : cur + delta
      const found = findEnabled(start, delta)
      return found === -1 ? cur : found
    })
  }

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
        else toggleOption(filteredOptions[highlightedIndex])
        break
      case ' ':
        // Space opens a closed menu (any mode); toggles only when open & not searchable
        if (!open) {
          event.preventDefault()
          openMenu()
        } else if (!searchable) {
          event.preventDefault()
          toggleOption(filteredOptions[highlightedIndex])
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
      case 'Backspace':
        // remove the last chip when the (search) input is empty or there's no search box
        if (open && (!searchable || searchQuery === '') && selectedValues.length > 0) {
          event.preventDefault()
          removeValue(selectedValues[selectedValues.length - 1])
        }
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
    const next = event.relatedTarget as Node | null
    if (next && (popoverRef.current?.contains(next) || triggerRef.current?.contains(next))) return
    bound?.onBlur(event as unknown as FocusEvent<HTMLInputElement>)
  }

  const activeId = open && highlightedIndex >= 0 ? optionId(highlightedIndex) : undefined
  // chevron size per field size: sm 16 · md 14 · lg 12
  const chevronPx = size === 'sm' ? 16 : size === 'md' ? 14 : 12
  const hasValue = selectedValues.length > 0

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
        className={clsx(styles.control, open && styles.open, hasValue && styles.filled)}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={handleKeyDown}
        onBlur={handleTriggerBlur}
      >
        {hasValue ? (
          <span className={styles.chips}>
            {selectedValues.map((v) => {
              const opt = options.find((o) => o.value === v)
              return (
                <Chip
                  key={v}
                  size={size}
                  color={color}
                  disabled={disabled}
                  onDelete={() => removeValue(v)}
                  deleteLabel={`Remove ${opt?.label ?? v}`}
                  // the combobox owns keyboard focus — keep chip deletes out of the tab order
                  deleteTabIndex={-1}
                >
                  {opt?.label ?? v}
                </Chip>
              )
            })}
          </span>
        ) : (
          <span className={clsx(styles.value, styles.placeholder)}>
            <span className={styles.valueLabel}>{placeholder}</span>
          </span>
        )}

        {clearable && hasValue && !disabled && (
          <button
            type="button"
            className={styles.clear}
            aria-label="Clear all"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation()
              commit([])
              triggerRef.current?.focus()
            }}
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

            <List
              role="listbox"
              id={listboxId}
              aria-labelledby={label != null ? labelId : undefined}
              aria-multiselectable="true"
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
                  const isSelected = selectedValues.includes(opt.value)
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
                      onClick={() => toggleOption(opt)}
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
