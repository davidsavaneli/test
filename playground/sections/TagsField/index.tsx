import { useState } from 'react'
import { Col, TagsField } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

export function TagsFieldSection() {
  const [skills, setSkills] = useState('react;typescript') // string value (separator ";")
  const [langs, setLangs] = useState<string[]>(['English', 'ქართული']) // array value

  return (
    <Section>
      <Block label="basic — type & press Enter or the + button">
        <Col gap={16} style={{ maxWidth: 420 }}>
          <TagsField label="Tags" placeholder="Add a tag…" defaultValue={['design', 'admin']} />
          <TagsField label="Empty" placeholder="Type, then Enter…" />
        </Col>
      </Block>

      <Block label='string value · separator ";" (joined string in & out)'>
        <Col gap={16} style={{ maxWidth: 420 }}>
          <TagsField
            label="Skills"
            value={skills}
            onChange={(v) => setSkills(v as string)}
            separator=";"
            placeholder="react;typescript…"
            helperText={`Value: "${skills}"`}
          />
        </Col>
      </Block>

      <Block label="array value">
        <Col gap={16} style={{ maxWidth: 420 }}>
          <TagsField
            label="Languages"
            value={langs}
            onChange={(v) => setLangs(v as string[])}
            color="info"
            placeholder="Add a language…"
            helperText={`Value: [${langs.map((l) => `"${l}"`).join(', ')}]`}
          />
        </Col>
      </Block>

      <Block label="sizes">
        <Col gap={16} style={{ maxWidth: 420 }}>
          {SIZES.map((s) => (
            <TagsField
              key={s}
              size={s}
              label={`Size ${s.toUpperCase()}`}
              defaultValue={['one', 'two']}
              placeholder={s}
            />
          ))}
        </Col>
      </Block>

      <Block label="states">
        <Col gap={16} style={{ maxWidth: 420 }}>
          <TagsField label="With error" required error helperText="Add at least one tag" />
          <TagsField label="Disabled" disabled defaultValue={['locked', 'tag']} />
        </Col>
      </Block>
    </Section>
  )
}
