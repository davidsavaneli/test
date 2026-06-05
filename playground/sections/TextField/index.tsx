import { useState } from 'react'
import { Col, Icon, TextField } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

export function TextFieldSection() {
  const [phone, setPhone] = useState('')
  const [digits, setDigits] = useState('')

  return (
    <Section>
      <Block label="basic">
        <Col gap={16} style={{ maxWidth: 360 }}>
          <TextField label="Title" placeholder="Enter a title" fullWidth />
          <TextField label="Title" defaultValue="სავაჭრო ცენტრი სითი მოლი Title D" fullWidth />
          <TextField label="Disabled" placeholder="Can't type here" disabled fullWidth />
        </Col>
      </Block>

      <Block label="sizes">
        <Col gap={16} style={{ maxWidth: 360 }}>
          {SIZES.map((s) => (
            <TextField
              key={s}
              size={s}
              label={`Size ${s.toUpperCase()}`}
              placeholder={s}
              fullWidth
            />
          ))}
        </Col>
      </Block>

      <Block label="adornment — icon (static / clickable) & text">
        <Col gap={16} style={{ maxWidth: 360 }}>
          <TextField
            label="Working Hours"
            adornment={<Icon name="Clock" />}
            placeholder="Select hours"
            fullWidth
          />
          <TextField
            label="Search"
            adornment={<Icon name="SearchNormal" />}
            adornmentPosition="right"
            adornmentLabel="Search"
            onAdornmentClick={() => alert('Search clicked')}
            placeholder="Search…"
            fullWidth
          />
          <TextField label="Website" adornment="https://" placeholder="example.com" fullWidth />
          <TextField
            label="Weight"
            adornment="kg"
            adornmentPosition="right"
            placeholder="0"
            fullWidth
          />
        </Col>
      </Block>

      <Block label="error state">
        <Col gap={16} style={{ maxWidth: 360 }}>
          <TextField label="Title" error helperText="Required" fullWidth />
        </Col>
      </Block>

      <Block label="regex (digits only) · mask (phone)">
        <Col gap={16} style={{ maxWidth: 360 }}>
          <TextField
            label="Digits Only"
            value={digits}
            onChange={(e) => setDigits(e.target.value)}
            regex={/^\d*$/}
            placeholder="123456"
            helperText="Try typing letters — they're blocked"
            fullWidth
          />
          <TextField
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            mask="(999) 999-9999"
            adornment={<Icon name="Call" />}
            placeholder="(___) ___-____"
            fullWidth
          />
        </Col>
      </Block>

      <Block label="more masks (9 = digit · a = letter · * = alphanumeric)">
        <Col gap={16} style={{ maxWidth: 360 }}>
          <TextField
            label="Card Number"
            mask="9999 9999 9999 9999"
            adornment={<Icon name="Card" />}
            placeholder="0000 0000 0000 0000"
            fullWidth
          />
          <TextField label="Expiry" mask="99/99" placeholder="MM/YY" fullWidth />
          <TextField label="Date" mask="99/99/9999" placeholder="DD/MM/YYYY" fullWidth />
          <TextField label="Time" mask="99:99" placeholder="HH:MM" fullWidth />
          <TextField label="License Plate" mask="aa-999-aa" placeholder="AB-123-CD" fullWidth />
        </Col>
      </Block>
    </Section>
  )
}
