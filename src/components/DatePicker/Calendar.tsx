import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { clsx } from 'clsx'
import { useT, type MessageKey } from '../../theme'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { buildMonthGrid, isDisabled, today, toISO, yearList, type Dayjs } from './dateUtils'
import styles from './DatePicker.module.css'

export interface CalendarProps {
  /** Currently selected date (UTC dayjs) or null. */
  value: Dayjs | null
  /** The month currently shown (UTC dayjs). */
  month: Dayjs
  /** Change the shown month. */
  onMonthChange: (month: Dayjs) => void
  /** Commit a selected date as an ISO `'YYYY-MM-DD'` string. */
  onSelect: (iso: string) => void
  min: Dayjs | null
  max: Dayjs | null
  disabledDate?: (iso: string) => boolean
  /** 0 = Sunday … 6 = Saturday. */
  weekStartsOn: number
  /** Focus the active cell on mount (when the popover opens). */
  autoFocus?: boolean
  /** Id of the element labelling the grid. */
  labelId?: string
}

type View = 'day' | 'month' | 'year'

/** Picks the day that should hold roving focus for a given month. */
function focusableDay(value: Dayjs | null, month: Dayjs): Dayjs {
  if (value && value.isSame(month, 'month')) return value
  const now = today()
  if (now.isSame(month, 'month')) return now
  return month.startOf('month')
}

/** Number of columns in the month / year picker grids (drives Up/Down arrow steps). */
const PICK_COLS = 3

/**
 * The calendar grid used by the date components. Three views — a `role="grid"` **day** view with full
 * keyboard navigation (Arrows move days, Home/End the week, PageUp/Down the month, Shift+PageUp/Down
 * the year, Enter/Space to select), plus separate **month** and **year** picker views reached from the
 * header (the month and year labels are independently clickable). Picking a year advances to the month
 * view; picking a month returns to the day view. The year view lists every year in range and scrolls.
 * Controlled: the consumer owns `value` + `month`; `onSelect`/`onMonthChange` lift changes up.
 */
export function Calendar({
  value,
  month,
  onMonthChange,
  onSelect,
  min,
  max,
  disabledDate,
  weekStartsOn,
  autoFocus,
  labelId,
}: CalendarProps) {
  const t = useT()
  const [view, setView] = useState<View>('day')
  const [focused, setFocused] = useState<Dayjs>(() => focusableDay(value, month))
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const focusOnRender = useRef(Boolean(autoFocus))

  // re-anchor the roving focus into the month whenever it changes from outside (nav buttons, pickers)
  useEffect(() => {
    setFocused((f) => (f.isSame(month, 'month') ? f : focusableDay(value, month)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  // move DOM focus to the roving cell after a keyboard move, a view switch, or the initial autoFocus
  useEffect(() => {
    if (!focusOnRender.current) return
    focusOnRender.current = false
    const el = bodyRef.current?.querySelector<HTMLElement>('[tabindex="0"]')
    el?.focus()
    el?.scrollIntoView?.({ block: 'nearest' })
  }, [focused, view, month])

  const switchTo = (next: View) => {
    focusOnRender.current = true
    setView(next)
  }

  // ── navigation helpers ─────────────────────────────────────────────────────────────────────────
  const moveDay = (next: Dayjs) => {
    focusOnRender.current = true
    if (!next.isSame(month, 'month')) onMonthChange(next.startOf('month'))
    setFocused(next)
  }
  const stepMonthBy = (delta: number) => {
    const next = focused.add(delta, 'month')
    focusOnRender.current = true
    setFocused(next)
    onMonthChange(next.startOf('month')) // keep the rendered grid + header in sync with focus
  }
  const stepYearBy = (delta: number) => {
    let year = focused.year() + delta
    if (min) year = Math.max(year, min.year())
    if (max) year = Math.min(year, max.year())
    const next = focused.year(year)
    focusOnRender.current = true
    setFocused(next)
    onMonthChange(next.startOf('month')) // re-anchor the year window so focus never leaves it
  }

  const pickYear = (y: number) => {
    const next = month.year(y)
    focusOnRender.current = true
    setFocused(next)
    onMonthChange(next)
    setView('month') // picking a year advances to the month view
  }
  const pickMonth = (m: number) => {
    const next = month.month(m)
    focusOnRender.current = true
    setFocused(focusableDay(value, next))
    onMonthChange(next)
    setView('day') // picking a month returns to the day view
  }

  // ── keyboard ─────────────────────────────────────────────────────────────────────────────────────
  const handleDayKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const offsetInWeek = (focused.day() - weekStartsOn + 7) % 7
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        moveDay(focused.subtract(1, 'day'))
        break
      case 'ArrowRight':
        event.preventDefault()
        moveDay(focused.add(1, 'day'))
        break
      case 'ArrowUp':
        event.preventDefault()
        moveDay(focused.subtract(7, 'day'))
        break
      case 'ArrowDown':
        event.preventDefault()
        moveDay(focused.add(7, 'day'))
        break
      case 'Home':
        event.preventDefault()
        moveDay(focused.subtract(offsetInWeek, 'day'))
        break
      case 'End':
        event.preventDefault()
        moveDay(focused.add(6 - offsetInWeek, 'day'))
        break
      case 'PageUp':
        event.preventDefault()
        moveDay(focused.subtract(1, event.shiftKey ? 'year' : 'month'))
        break
      case 'PageDown':
        event.preventDefault()
        moveDay(focused.add(1, event.shiftKey ? 'year' : 'month'))
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (!isDisabled(focused, min, max, disabledDate)) onSelect(toISO(focused))
        break
    }
  }

  const handleMonthKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        stepMonthBy(-1)
        break
      case 'ArrowRight':
        event.preventDefault()
        stepMonthBy(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        stepMonthBy(-PICK_COLS)
        break
      case 'ArrowDown':
        event.preventDefault()
        stepMonthBy(PICK_COLS)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        pickMonth(focused.month())
        break
    }
  }

  const handleYearKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        stepYearBy(-1)
        break
      case 'ArrowRight':
        event.preventDefault()
        stepYearBy(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        stepYearBy(-PICK_COLS)
        break
      case 'ArrowDown':
        event.preventDefault()
        stepYearBy(PICK_COLS)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        pickYear(focused.year())
        break
    }
  }

  // ── derived data (built once per render) ─────────────────────────────────────────────────────────
  const now = today()
  // month names + short weekday labels come from the i18n catalog (localized), not dayjs
  const monthName = (m: number) => t(`calendar.month${m}` as MessageKey)
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    t(`calendar.weekday${(weekStartsOn + i) % 7}` as MessageKey),
  )
  const monthGrid = view === 'day' ? buildMonthGrid(month, weekStartsOn) : []
  const months = view === 'month' ? Array.from({ length: 12 }, (_, m) => monthName(m)) : []
  const years = view === 'year' ? yearList(min, max, month.year()) : []

  return (
    <div className={styles.calendar}>
      <div className={styles.calHeader}>
        {view === 'day' && (
          <IconButton
            variant="text"
            color="primary"
            size="sm"
            aria-label={t('calendar.prevMonth')}
            onClick={() => onMonthChange(month.subtract(1, 'month'))}
          >
            <Icon name="ArrowCircleLeft" />
          </IconButton>
        )}

        <div className={styles.calTitleGroup}>
          {(view === 'day' || view === 'month') && (
            <button
              type="button"
              id={labelId}
              className={styles.calTitle}
              onClick={() => switchTo('year')}
            >
              {month.format('YYYY')}
            </button>
          )}
          {view === 'day' && (
            <button type="button" className={styles.calTitle} onClick={() => switchTo('month')}>
              {monthName(month.month())}
            </button>
          )}
          {view === 'year' && (
            <span id={labelId} className={styles.calTitleStatic}>
              {t('calendar.selectYear')}
            </span>
          )}
        </div>

        {view === 'day' && (
          <IconButton
            variant="text"
            color="primary"
            size="sm"
            aria-label={t('calendar.nextMonth')}
            onClick={() => onMonthChange(month.add(1, 'month'))}
          >
            <Icon name="ArrowCircleRight" />
          </IconButton>
        )}
      </div>

      {view === 'year' ? (
        <div
          ref={bodyRef}
          className={clsx(styles.pickGrid, styles.pickScroll)}
          role="listbox"
          aria-labelledby={labelId}
          onKeyDown={handleYearKeyDown}
        >
          {years.map((y) => {
            const isSelected = value ? value.year() === y : false
            return (
              <button
                key={y}
                type="button"
                role="option"
                className={clsx(
                  styles.pickCell,
                  isSelected && styles.pickSelected,
                  !isSelected && y === now.year() && styles.pickToday,
                )}
                tabIndex={y === focused.year() ? 0 : -1}
                aria-selected={isSelected}
                onClick={() => pickYear(y)}
              >
                {y}
              </button>
            )
          })}
        </div>
      ) : view === 'month' ? (
        <div
          ref={bodyRef}
          className={styles.pickGrid}
          role="listbox"
          aria-labelledby={labelId}
          onKeyDown={handleMonthKeyDown}
        >
          {months.map((label, m) => {
            const isSelected = value ? value.isSame(month.month(m), 'month') : false
            const isCurrent = now.isSame(month.month(m), 'month')
            return (
              <button
                key={label}
                type="button"
                role="option"
                className={clsx(
                  styles.pickCell,
                  isSelected && styles.pickSelected,
                  !isSelected && isCurrent && styles.pickToday,
                )}
                tabIndex={m === focused.month() ? 0 : -1}
                aria-selected={isSelected}
                onClick={() => pickMonth(m)}
              >
                {label}
              </button>
            )
          })}
        </div>
      ) : (
        <div
          ref={bodyRef}
          className={styles.grid}
          role="grid"
          aria-label={`${monthName(month.month())} ${month.format('YYYY')}`}
          onKeyDown={handleDayKeyDown}
        >
          <div className={styles.weekdays} role="row">
            {weekdays.map((w, i) => (
              <span key={i} role="columnheader" className={styles.weekday}>
                {w}
              </span>
            ))}
          </div>
          {Array.from({ length: 6 }, (_, wk) => (
            <div key={wk} role="row" className={styles.week}>
              {monthGrid.slice(wk * 7, wk * 7 + 7).map((d) => {
                const selected = value ? d.date.isSame(value, 'day') : false
                const disabled = isDisabled(d.date, min, max, disabledDate)
                return (
                  <button
                    key={d.iso}
                    type="button"
                    role="gridcell"
                    className={clsx(
                      styles.day,
                      !d.inMonth && styles.dayOutside,
                      selected && styles.daySelected,
                      d.isToday && styles.dayToday,
                      disabled && styles.dayDisabled,
                    )}
                    tabIndex={d.date.isSame(focused, 'day') ? 0 : -1}
                    aria-selected={selected}
                    aria-disabled={disabled || undefined}
                    aria-current={d.isToday ? 'date' : undefined}
                    onClick={() => !disabled && onSelect(d.iso)}
                  >
                    {d.date.date()}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
