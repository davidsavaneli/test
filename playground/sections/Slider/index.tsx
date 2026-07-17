import { useState } from 'react'
import { Col, Slider } from '../../../src'
import { Block, cap, Section, SIZES } from '../../shared'

const COLORS = ['accent', 'primary', 'success', 'info', 'warning', 'error'] as const

export function SliderSection() {
  const [value, setValue] = useState(40)
  const [range, setRange] = useState<[number, number]>([5, 10])

  return (
    <Section>
      <Block
        label="Basic — controlled"
        description="Drag or use arrow keys / Home / End; the value shows at the end of the label row."
      >
        <Slider label="Volume" value={value} onChange={(v) => setValue(v as number)} />
      </Block>

      <Block
        label="Range — two thumbs (a [start, end] span)"
        description="Pass range to pick a span, e.g. 5–10. Each thumb can't cross the other."
      >
        <Slider
          range
          label="Price"
          min={0}
          max={20}
          value={range}
          onChange={(v) => setRange(v as [number, number])}
        />
      </Block>

      <Block
        label="Steps + marks"
        description="step snaps the thumb (2 here); marks label fixed stops under the track."
      >
        <Slider
          label="Rating"
          defaultValue={6}
          min={0}
          max={10}
          step={2}
          marks={[
            { value: 0, label: '0' },
            { value: 2, label: '2' },
            { value: 4, label: '4' },
            { value: 6, label: '6' },
            { value: 8, label: '8' },
            { value: 10, label: '10' },
          ]}
        />
      </Block>

      <Block label="Value formatting — valueLabel as a function">
        <Slider label="Opacity" defaultValue={75} valueLabel={(v) => `${v}%`} />
      </Block>

      <Block label="Sizes — sm / md / lg">
        <Col gap={24}>
          {SIZES.map((s) => (
            <Slider key={s} size={s} label={`Size ${s}`} defaultValue={50} />
          ))}
        </Col>
      </Block>

      <Block label="Colors — the fill + thumb follow the color prop">
        <Col gap={24}>
          {COLORS.map((c) => (
            <Slider key={c} color={c} label={cap(c)} defaultValue={60} />
          ))}
        </Col>
      </Block>

      <Block
        label="Error + Disabled"
        description="error reddens the helper; disabled dims the control."
      >
        <Col gap={24}>
          <Slider label="Out of range" defaultValue={90} error helperText="Pick a lower value" />
          <Slider label="Locked" defaultValue={30} disabled />
        </Col>
      </Block>
    </Section>
  )
}
