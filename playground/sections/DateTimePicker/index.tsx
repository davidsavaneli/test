import { useState } from 'react'
import { Col, DateTimePicker, Grid } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

/** Disable weekends (Sat/Sun) — `iso` is a 'YYYY-MM-DD' string. */
const isWeekend = (iso: string) => {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay()
  return day === 0 || day === 6
}

export function DateTimePickerSection() {
  const [at, setAt] = useState('2026-06-10T09:35:00')
  const [created, setCreated] = useState('2026-06-10T09:35:49.6134342')

  return (
    <Section>
      <Block
        label="basic · controlled"
        description="Date + time in one field. The value is always an ISO datetime string."
      >
        <Col gap={16} style={{ maxWidth: 340 }}>
          <DateTimePicker label="When" value={at} onChange={setAt} helperText={`Value: "${at}"`} />
        </Col>
      </Block>

      <Block
        label="backend datetime · valueFormat"
        description="A .NET DateTime (sub-second precision) is accepted; onChange emits the chosen instant in valueFormat."
      >
        <Col gap={16} style={{ maxWidth: 340 }}>
          <DateTimePicker
            label="Created (UTC DateTime field)"
            valueFormat="YYYY-MM-DDTHH:mm:ss"
            value={created}
            onChange={setCreated}
            helperText={`Sends: "${created}"`}
          />
        </Col>
      </Block>

      <Block
        label="uncontrolled · defaultValue"
        description="Pass an ISO datetime defaultValue and let the field manage its own state."
      >
        <Col gap={16} style={{ maxWidth: 340 }}>
          <DateTimePicker label="When" defaultValue="2026-06-10T14:20:00" />
          <DateTimePicker label="Empty" />
        </Col>
      </Block>

      <Block
        label="12-hour clock (AM/PM)"
        description="hour12 switches the hours column to 1–12 with an AM/PM toggle and the display to hh:mm A."
      >
        <Col gap={16} style={{ maxWidth: 340 }}>
          <DateTimePicker label="When" hour12 defaultValue="2026-06-10T21:05:00" />
        </Col>
      </Block>

      <Block
        label="minuteStep · showSeconds"
        description="Seconds show by default (hours/minutes/seconds); minuteStep buckets the minutes, and showSeconds={false} drops the seconds column + :ss."
      >
        <Col gap={16} style={{ maxWidth: 340 }}>
          <DateTimePicker
            label="15-minute steps"
            minuteStep={15}
            defaultValue="2026-06-10T09:30:00"
          />
          <DateTimePicker
            label="No seconds"
            showSeconds={false}
            defaultValue="2026-06-10T09:35:49"
          />
        </Col>
      </Block>

      <Block
        label="min / max · disabledDate · week start"
        description="Day-level calendar bounds, a per-day predicate, and a configurable first day of week."
      >
        <Col gap={16} style={{ maxWidth: 340 }}>
          <DateTimePicker
            label="June 2026 only"
            min="2026-06-01"
            max="2026-06-30"
            defaultValue="2026-06-10T09:35:00"
            helperText="Dates outside June 2026 are disabled"
          />
          <DateTimePicker
            label="Weekdays only · Sunday start"
            disabledDate={isWeekend}
            weekStartsOn={0}
            helperText="Weekends are disabled"
          />
        </Col>
      </Block>

      <Block label="sizes" description="sm / md / lg — control height, font and popover density.">
        <Col gap={16} style={{ maxWidth: 340 }}>
          {SIZES.map((s) => (
            <DateTimePicker
              key={s}
              size={s}
              label={`Size ${s.toUpperCase()}`}
              defaultValue="2026-06-10T09:35:00"
            />
          ))}
        </Col>
      </Block>

      <Block
        label="states"
        description="Disabled, required, error + helperText, and clearable toggled off."
      >
        <Grid minItemWidth={240} gap={16}>
          <DateTimePicker label="Disabled" disabled defaultValue="2026-06-10T09:35:00" />
          <DateTimePicker label="Required" required defaultValue="2026-06-10T09:35:00" />
          <DateTimePicker label="With error" required error helperText="Pick a date and time" />
          <DateTimePicker
            label="Not clearable"
            clearable={false}
            defaultValue="2026-06-10T09:35:00"
            helperText="No × button"
          />
        </Grid>
      </Block>
    </Section>
  )
}
