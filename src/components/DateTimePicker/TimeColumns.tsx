import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { clsx } from 'clsx'
import { pad2, range, today, type Dayjs } from '../DatePicker/dateUtils'
import styles from './DateTimePicker.module.css'

export interface TimeColumnsProps {
  /** The working datetime (selected value) or null. */
  value: Dayjs | null
  /** Emit the next datetime when an hour / minute / second / meridiem is chosen. */
  onChange: (next: Dayjs) => void
  /** 12-hour clock (1–12 + AM/PM) instead of 24-hour (0–23). */
  hour12: boolean
  /** Minute increment for the minutes column. */
  minuteStep: number
  /** Show a seconds column. */
  showSeconds: boolean
  /** Focus the hours column on mount (when there's no calendar to take focus, e.g. `TimePicker`). */
  autoFocus?: boolean
}

interface Option<V> {
  value: V
  label: string
}

/** One scrollable, roving-focus column of time options (hours / minutes / seconds / meridiem). */
function TimeList<V>({
  options,
  selected,
  onSelect,
  label,
  autoFocus,
}: {
  options: Option<V>[]
  selected: V | null
  onSelect: (value: V) => void
  label: string
  autoFocus?: boolean
}) {
  const listRef = useRef<HTMLDivElement | null>(null)
  const focusOnRender = useRef(Boolean(autoFocus))
  const selectedIndex = options.findIndex((o) => o.value === selected)
  const [focusedIndex, setFocusedIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0)

  // re-anchor roving focus to the selected option and scroll it into view when it changes externally
  useEffect(() => {
    if (selectedIndex >= 0) setFocusedIndex(selectedIndex)
    const el =
      listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]') ??
      listRef.current?.querySelector<HTMLElement>('[tabindex="0"]')
    el?.scrollIntoView?.({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  // move DOM focus to the roving option after a keyboard move
  useEffect(() => {
    if (!focusOnRender.current) return
    focusOnRender.current = false
    const el = listRef.current?.querySelector<HTMLElement>('[tabindex="0"]')
    el?.focus()
    el?.scrollIntoView?.({ block: 'nearest' })
  }, [focusedIndex])

  const move = (index: number) => {
    focusOnRender.current = true
    setFocusedIndex(Math.max(0, Math.min(options.length - 1, index)))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        move(focusedIndex - 1)
        break
      case 'ArrowDown':
        event.preventDefault()
        move(focusedIndex + 1)
        break
      case 'Home':
        event.preventDefault()
        move(0)
        break
      case 'End':
        event.preventDefault()
        move(options.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onSelect(options[focusedIndex].value)
        break
    }
  }

  return (
    <div className={styles.timeCol}>
      <span className={styles.timeColLabel}>{label}</span>
      <div
        ref={listRef}
        className={styles.timeScroll}
        role="listbox"
        aria-label={label}
        onKeyDown={handleKeyDown}
      >
        {options.map((opt, i) => {
          const isSelected = opt.value === selected
          return (
            <button
              key={opt.label}
              type="button"
              role="option"
              className={clsx(styles.timeCell, isSelected && styles.timeCellSelected)}
              tabIndex={i === focusedIndex ? 0 : -1}
              aria-selected={isSelected}
              onClick={() => onSelect(opt.value)}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const numberOptions = (values: number[]): Option<number>[] =>
  values.map((v) => ({ value: v, label: pad2(v) }))

const MERIDIEM_OPTIONS: Option<boolean>[] = [
  { value: false, label: 'AM' },
  { value: true, label: 'PM' },
]

/**
 * The time-picker columns shown beside the calendar in `DateTimePicker`. Scrollable hour + minute
 * (+ optional seconds) lists plus an AM/PM toggle in 12-hour mode — each a roving-focus listbox. All
 * math is UTC; each pick keeps the rest of the datetime intact (changing the hour preserves
 * minutes/seconds, etc.). When `value` is null a pick anchors to today's date at the chosen time.
 */
export function TimeColumns({
  value,
  onChange,
  hour12,
  minuteStep,
  showSeconds,
  autoFocus,
}: TimeColumnsProps) {
  const base = value ?? today()
  const h24 = base.hour()
  const isPM = h24 >= 12
  const step = minuteStep >= 1 ? Math.floor(minuteStep) : 1

  const hourOptions = numberOptions(hour12 ? range(1, 12) : range(0, 23))
  const selectedHour = value ? (hour12 ? h24 % 12 || 12 : h24) : null

  const pickHour = (h: number) =>
    onChange(hour12 ? base.hour((h % 12) + (isPM ? 12 : 0)) : base.hour(h))
  const pickMinute = (m: number) => onChange(base.minute(m))
  const pickSecond = (s: number) => onChange(base.second(s))
  const pickMeridiem = (pm: boolean) =>
    onChange(pm === isPM ? base : base.hour(pm ? h24 + 12 : h24 - 12))

  return (
    <div className={styles.timeCols}>
      <TimeList
        options={hourOptions}
        selected={selectedHour}
        onSelect={pickHour}
        label="Hour"
        autoFocus={autoFocus}
      />
      <TimeList
        options={numberOptions(range(0, 59, step))}
        selected={value ? base.minute() : null}
        onSelect={pickMinute}
        label="Minute"
      />
      {showSeconds && (
        <TimeList
          options={numberOptions(range(0, 59))}
          selected={value ? base.second() : null}
          onSelect={pickSecond}
          label="Second"
        />
      )}
      {hour12 && (
        <TimeList
          options={MERIDIEM_OPTIONS}
          selected={value ? isPM : null}
          onSelect={pickMeridiem}
          label="AM/PM"
        />
      )}
    </div>
  )
}
