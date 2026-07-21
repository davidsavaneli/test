import { Col, Flag, Row, Typography } from '../../../src'
import { Block, Section } from '../../shared'

// the languages the library ships a built-in flag for (base code → label)
const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en-US', label: 'English' },
  { code: 'ka-GE', label: 'ქართული' },
  { code: 'es-ES', label: 'Español' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'it-IT', label: 'Italiano' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'ru-RU', label: 'Русский' },
]

export function FlagSection() {
  return (
    <Section>
      <Block label="Built-in language flags">
        <Row gap={20} wrap>
          {LANGUAGES.map((l) => (
            <Col key={l.code} gap={6} style={{ alignItems: 'center', width: 72 }}>
              <Flag code={l.code} size={28} />
              <Typography variant="caption" color="muted">
                {l.label}
              </Typography>
            </Col>
          ))}
        </Row>
      </Block>

      <Block label="Sizes (height in px)">
        <Row gap={16} style={{ alignItems: 'center' }}>
          {[12, 16, 20, 28, 40].map((s) => (
            <Flag key={s} code="ka-GE" size={s} />
          ))}
        </Row>
      </Block>

      <Block label="Matched by base language (ka-GE → ka)">
        <Row gap={16} style={{ alignItems: 'center' }}>
          <Flag code="ka" size={24} />
          <Flag code="ka-GE" size={24} />
          <Flag code="en" size={24} />
          <Flag code="en-GB" size={24} />
        </Row>
      </Block>

      <Block label="Renders nothing for a language with no shipped flag (nl-NL)">
        <Row gap={8} style={{ alignItems: 'center' }}>
          <Flag code="nl-NL" size={24} />
          <Typography variant="caption" color="muted">
            (no flag rendered)
          </Typography>
        </Row>
      </Block>
    </Section>
  )
}
