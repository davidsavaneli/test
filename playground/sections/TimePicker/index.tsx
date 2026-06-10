import { useState } from 'react'
import { Col, Grid, TimePicker } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

export function TimePickerSection() {
  const [at, setAt] = useState('09:35:00')
  const [openedAt, setOpenedAt] = useState('09:35:49.6134342')

  return (
    <Section>
      <Block
        label="basic · controlled"
        description="A time-of-day field. The value is a time string in valueFormat (default 'HH:mm:ss')."
      >
        <Col gap={16} style={{ maxWidth: 300 }}>
          <TimePicker label="Time" value={at} onChange={setAt} helperText={`Value: "${at}"`} />
        </Col>
      </Block>

      <Block
        label="backend time · valueFormat (lenient in)"
        description="A backend time with sub-second precision is accepted; onChange emits in valueFormat."
      >
        <Col gap={16} style={{ maxWidth: 300 }}>
          <TimePicker
            label="Opened at"
            value={openedAt}
            onChange={setOpenedAt}
            helperText={`Sends: "${openedAt}"`}
          />
        </Col>
      </Block>

      <Block
        label="uncontrolled · defaultValue"
        description="Pass a defaultValue and let the field manage its own state."
      >
        <Col gap={16} style={{ maxWidth: 300 }}>
          <TimePicker label="Time" defaultValue="14:20:00" />
          <TimePicker label="Empty" />
        </Col>
      </Block>

      <Block
        label="12-hour clock (AM/PM)"
        description="hour12 switches the hours column to 1–12 with an AM/PM toggle and the display to hh:mm A."
      >
        <Col gap={16} style={{ maxWidth: 300 }}>
          <TimePicker label="Time" hour12 defaultValue="21:05:00" />
        </Col>
      </Block>

      <Block
        label="minuteStep · showSeconds"
        description="Seconds show by default (hours/minutes/seconds); minuteStep buckets the minutes, and showSeconds={false} drops the seconds column + :ss."
      >
        <Col gap={16} style={{ maxWidth: 300 }}>
          <TimePicker label="15-minute steps" minuteStep={15} defaultValue="09:30:00" />
          <TimePicker label="No seconds" showSeconds={false} defaultValue="09:35:49" />
        </Col>
      </Block>

      <Block label="sizes" description="sm / md / lg — control height, font and popover density.">
        <Col gap={16} style={{ maxWidth: 300 }}>
          {SIZES.map((s) => (
            <TimePicker
              key={s}
              size={s}
              label={`Size ${s.toUpperCase()}`}
              defaultValue="09:35:00"
            />
          ))}
        </Col>
      </Block>

      <Block
        label="states"
        description="Disabled, required, error + helperText, and clearable toggled off."
      >
        <Grid minItemWidth={220} gap={16}>
          <TimePicker label="Disabled" disabled defaultValue="09:35:00" />
          <TimePicker label="Required" required defaultValue="09:35:00" />
          <TimePicker label="With error" required error helperText="Pick a time" />
          <TimePicker
            label="Not clearable"
            clearable={false}
            defaultValue="09:35:00"
            helperText="No × button"
          />
        </Grid>
      </Block>
    </Section>
  )
}
