import { useState } from 'react'
import {
  Col,
  Icon,
  Row,
  ToggleButton,
  ToggleButtonGroup,
  type ToggleButtonOption,
  Typography,
} from '../../../src'
import { Block, cap, Section, SIZES } from '../../shared'

const ALIGN: ToggleButtonOption[] = [
  { value: 'left', icon: 'TextalignLeft', ariaLabel: 'Align left' },
  { value: 'center', icon: 'TextalignCenter', ariaLabel: 'Align center' },
  { value: 'right', icon: 'TextalignRight', ariaLabel: 'Align right' },
  { value: 'justify', icon: 'TextalignJustifycenter', ariaLabel: 'Justify' },
]

const FORMATS: ToggleButtonOption[] = [
  { value: 'bold', icon: 'TextBold', ariaLabel: 'Bold' },
  { value: 'italic', icon: 'TextItalic', ariaLabel: 'Italic' },
  { value: 'underline', icon: 'TextUnderline', ariaLabel: 'Underline' },
]

const VIEWS: ToggleButtonOption[] = [
  { value: 'list', label: 'List', icon: 'RowVertical' },
  { value: 'grid', label: 'Grid', icon: 'Grid3' },
  { value: 'board', label: 'Board', icon: 'Category' },
]

const COLORS = ['primary', 'success', 'info', 'warning', 'error'] as const

export function ToggleButtonSection() {
  const [align, setAlign] = useState<string | null>('left')
  const [formats, setFormats] = useState<string[]>(['bold'])
  const [view, setView] = useState<string | null>('grid')

  return (
    <Section>
      <Block
        label="Exclusive — single selection (segmented control)"
        description="Icon-only buttons; clicking the active one deselects it. value is a string | null."
      >
        <Row gap={16} wrap align="center">
          <ToggleButtonGroup
            exclusive
            options={ALIGN}
            value={align}
            onChange={(v) => setAlign(v as string | null)}
          />
          <Typography variant="bodySmall" color="muted">
            align: {align ?? 'none'}
          </Typography>
        </Row>
      </Block>

      <Block
        label="Multiple — many selected at once"
        description="Default mode; value is a string[] (like text formatting)."
      >
        <Row gap={16} wrap align="center">
          <ToggleButtonGroup
            options={FORMATS}
            value={formats}
            onChange={(v) => setFormats(v as string[])}
          />
          <Typography variant="bodySmall" color="muted">
            formats: [{formats.join(', ')}]
          </Typography>
        </Row>
      </Block>

      <Block label="Icon + label — exclusive view switcher">
        <ToggleButtonGroup
          exclusive
          options={VIEWS}
          value={view}
          onChange={(v) => setView(v as string | null)}
        />
      </Block>

      <Block label="Sizes — sm / md / lg">
        <Col gap={16}>
          {SIZES.map((s) => (
            <ToggleButtonGroup key={s} exclusive size={s} options={ALIGN} defaultValue="left" />
          ))}
        </Col>
      </Block>

      <Block label="Colors — the selected tint follows the color prop">
        <Row gap={16} wrap>
          {COLORS.map((c) => (
            <ToggleButtonGroup key={c} exclusive color={c} options={VIEWS} defaultValue="grid" />
          ))}
        </Row>
      </Block>

      <Block label="Vertical orientation">
        <ToggleButtonGroup exclusive orientation="vertical" options={VIEWS} defaultValue="list" />
      </Block>

      <Block
        label="Full width + a disabled option"
        description="The group stretches to fill the row; the Board option is individually disabled."
      >
        <ToggleButtonGroup
          exclusive
          fullWidth
          defaultValue="list"
          options={[
            { value: 'list', label: 'List', icon: 'RowVertical' },
            { value: 'grid', label: 'Grid', icon: 'Grid3' },
            { value: 'board', label: 'Board', icon: 'Category', disabled: true },
          ]}
        />
      </Block>

      <Block label="Disabled group">
        <ToggleButtonGroup exclusive disabled options={VIEWS} defaultValue="grid" />
      </Block>

      <Block label="Standalone — a single toggle button (children, not a group)">
        <Row gap={16} wrap>
          <StandaloneToggle />
        </Row>
      </Block>
    </Section>
  )
}

/** A standalone toggle (no group) — controlled by its own selected state. */
function StandaloneToggle() {
  const [on, setOn] = useState(true)
  return (
    <>
      <ToggleButton value="star" color="warning" selected={on} onChange={setOn}>
        <Icon name="Star" />
        Favorite
      </ToggleButton>
      <Typography variant="bodySmall" color="muted" style={{ alignSelf: 'center' }}>
        {on ? 'On' : 'Off'} · {cap('standalone')}
      </Typography>
    </>
  )
}
