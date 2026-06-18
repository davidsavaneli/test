import { useState } from 'react'
import { Alert, Button, Col } from '../../../src'
import { Block, Section } from '../../shared'

const VARIANTS = ['filled', 'contained', 'outlined', 'text'] as const
const COLORS = ['success', 'error', 'warning', 'info'] as const

export function AlertSection() {
  const [closed, setClosed] = useState(false)

  return (
    <Section>
      <Block
        label="Variants — filled (default) / contained / outlined / text"
        description="Tinted by color via the shared --tz-btn-rgb pattern."
      >
        <Col gap={12}>
          {VARIANTS.map((v) => (
            <Alert key={v} variant={v} color="info">
              Lorem, ipsum dolor sit amet consectetur adipisicing elit.
            </Alert>
          ))}
        </Col>
      </Block>

      <Block label="Semantic colors — each picks its own icon">
        <Col gap={12}>
          {COLORS.map((c) => (
            <Alert key={c} color={c}>
              This is a {c} Alert.
            </Alert>
          ))}
        </Col>
      </Block>

      <Block label="Outlined colors">
        <Col gap={12}>
          {COLORS.map((c) => (
            <Alert key={c} variant="outlined" color={c}>
              This is an outlined {c} Alert.
            </Alert>
          ))}
        </Col>
      </Block>

      <Block label="With an action — a trailing button (e.g. Undo)">
        <Alert
          color="info"
          action={
            <Button variant="text" color="info" size="sm">
              Undo
            </Button>
          }
        >
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ducimus, voluptatum pariatur
          corrupti quaerat ex voluptatibus incidunt.
        </Alert>
      </Block>

      <Block label="Closable — onClose adds a × button">
        {closed ? (
          <Button variant="outlined" size="sm" onClick={() => setClosed(false)}>
            Restore Alert
          </Button>
        ) : (
          <Alert color="info" onClose={() => setClosed(true)}>
            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ducimus, voluptatum pariatur
            corrupti quaerat ex voluptatibus incidunt.
          </Alert>
        )}
      </Block>

      <Block label="Without an icon — icon={false}">
        <Alert color="warning" icon={false}>
          A plain alert with no leading icon.
        </Alert>
      </Block>
    </Section>
  )
}
