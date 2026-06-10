import { useState } from 'react'
import { Col, DatePicker, Grid } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

/** Disable weekends (Sat/Sun) — `iso` is a 'YYYY-MM-DD' string. */
const isWeekend = (iso: string) => {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay()
  return day === 0 || day === 6
}

export function DatePickerSection() {
  const [date, setDate] = useState('2026-06-10T09:35:49')
  const [createdUtc, setCreatedUtc] = useState('2026-06-10T09:35:49.6134342')
  const [dateOnly, setDateOnly] = useState('2026-06-10')

  return (
    <Section>
      <Block
        label="basic · controlled"
        description="Controlled with value + onChange. The value is always an ISO string (default ISO datetime)."
      >
        <Col gap={16} style={{ maxWidth: 320 }}>
          <DatePicker
            label="Date"
            value={date}
            onChange={setDate}
            helperText={`Value: "${date}"`}
          />
        </Col>
      </Block>

      <Block
        label="uncontrolled · defaultValue"
        description="Pass an ISO datetime defaultValue and let the field manage its own state."
      >
        <Col gap={16} style={{ maxWidth: 320 }}>
          <DatePicker label="Date" defaultValue="2026-05-10T09:35:49" />
          <DatePicker label="Empty" placeholder="dd/mm/yyyy" />
        </Col>
      </Block>

      <Block
        label="backend datetime · valueFormat (lenient in, formatted out)"
        description="A .NET DateTime field comes in with sub-second precision and is accepted; onChange emits the same shape at the start of the UTC day."
      >
        <Col gap={16} style={{ maxWidth: 320 }}>
          <DatePicker
            label="Created (UTC DateTime field)"
            valueFormat="YYYY-MM-DDTHH:mm:ss"
            value={createdUtc}
            onChange={setCreatedUtc}
            helperText={`Sends: "${createdUtc}"`}
          />
        </Col>
      </Block>

      <Block
        label="valueFormat — the wire shape of the value"
        description="Decoupled from the display format. Default is ISO datetime; pass 'YYYY-MM-DD' for a plain date or any dayjs tokens."
      >
        <Col gap={16} style={{ maxWidth: 320 }}>
          <DatePicker
            label="ISO datetime (default)"
            defaultValue="2026-06-10T09:35:49"
            helperText="onChange → 2026-06-10T00:00:00"
          />
          <DatePicker
            label="Date only"
            valueFormat="YYYY-MM-DD"
            value={dateOnly}
            onChange={setDateOnly}
            helperText={`Sends: "${dateOnly}"`}
          />
          <DatePicker
            label="ISO with Z (UTC)"
            valueFormat="YYYY-MM-DDTHH:mm:ss[Z]"
            defaultValue="2026-06-10T00:00:00Z"
            helperText="onChange → 2026-06-10T00:00:00Z"
          />
        </Col>
      </Block>

      <Block
        label="display format — typed input mask follows it"
        description="The `format` prop only changes what's shown / typed; the stored value stays in valueFormat."
      >
        <Col gap={16} style={{ maxWidth: 320 }}>
          <DatePicker label="DD/MM/YYYY (default)" defaultValue="2026-06-10T09:35:49" />
          <DatePicker label="YYYY-MM-DD" format="YYYY-MM-DD" defaultValue="2026-06-10T09:35:49" />
          <DatePicker label="MM/DD/YYYY" format="MM/DD/YYYY" defaultValue="2026-06-10T09:35:49" />
          <DatePicker label="DD.MM.YYYY" format="DD.MM.YYYY" defaultValue="2026-06-10T09:35:49" />
        </Col>
      </Block>

      <Block
        label="min / max — bounded range"
        description="Out-of-range days are shown but not selectable (ISO 'YYYY-MM-DD' bounds)."
      >
        <Col gap={16} style={{ maxWidth: 320 }}>
          <DatePicker
            label="June 2026 only"
            min="2026-06-01"
            max="2026-06-30"
            defaultValue="2026-06-10T09:35:49"
            helperText="Dates outside June 2026 are disabled"
          />
          <DatePicker label="From today onward" min="2026-06-10" helperText="Past dates disabled" />
        </Col>
      </Block>

      <Block
        label="disabledDate — per-day predicate"
        description="A (iso) => boolean callback to disable arbitrary days, e.g. weekends."
      >
        <Col gap={16} style={{ maxWidth: 320 }}>
          <DatePicker
            label="Weekdays only"
            disabledDate={isWeekend}
            helperText="Weekends (Sat/Sun) are disabled"
          />
        </Col>
      </Block>

      <Block
        label="weekStartsOn — first day of the week"
        description="0 = Sunday … 6 = Saturday (default 1 = Monday)."
      >
        <Col gap={16} style={{ maxWidth: 320 }}>
          <DatePicker
            label="Week starts Monday (default)"
            weekStartsOn={1}
            defaultValue="2026-06-10T09:35:49"
          />
          <DatePicker
            label="Week starts Sunday"
            weekStartsOn={0}
            defaultValue="2026-06-10T09:35:49"
          />
        </Col>
      </Block>

      <Block label="sizes" description="sm / md / lg — control height, font and calendar density.">
        <Col gap={16} style={{ maxWidth: 320 }}>
          {SIZES.map((s) => (
            <DatePicker
              key={s}
              size={s}
              label={`Size ${s.toUpperCase()}`}
              defaultValue="2026-06-10T09:35:49"
            />
          ))}
        </Col>
      </Block>

      <Block
        label="states"
        description="Disabled, required, error + helperText, and clearable toggled off."
      >
        <Grid minItemWidth={220} gap={16}>
          <DatePicker label="Disabled" disabled defaultValue="2026-06-10T09:35:49" />
          <DatePicker label="Required" required defaultValue="2026-06-10T09:35:49" />
          <DatePicker label="With error" required error helperText="Pick a date" />
          <DatePicker
            label="Not clearable"
            clearable={false}
            defaultValue="2026-06-10T09:35:49"
            helperText="No × button"
          />
        </Grid>
      </Block>
    </Section>
  )
}
