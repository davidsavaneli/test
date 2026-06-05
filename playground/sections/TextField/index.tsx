import { useState, type CSSProperties } from 'react'
import { Icon, TextField } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

export function TextFieldSection() {
  const [phone, setPhone] = useState('')
  const [digits, setDigits] = useState('')
  const colStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    maxWidth: 360,
  }

  return (
    <Section>
      <Block label="basic">
        <div style={colStyle}>
          <TextField label="Title" placeholder="Enter a title" fullWidth />
          <TextField label="Title" defaultValue="სავაჭრო ცენტრი სითი მოლი Title D" fullWidth />
          <TextField label="Disabled" placeholder="Can't type here" disabled fullWidth />
        </div>
      </Block>

      <Block label="sizes">
        <div style={colStyle}>
          {SIZES.map((s) => (
            <TextField
              key={s}
              size={s}
              label={`Size ${s.toUpperCase()}`}
              placeholder={s}
              fullWidth
            />
          ))}
        </div>
      </Block>

      <Block label="adornment — icon (static / clickable) & text">
        <div style={colStyle}>
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
        </div>
      </Block>

      <Block label="error state">
        <div style={colStyle}>
          <TextField label="Title" error helperText="Required" fullWidth />
        </div>
      </Block>

      <Block label="regex (digits only) · mask (phone)">
        <div style={colStyle}>
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
        </div>
      </Block>

      <Block label="more masks (9 = digit · a = letter · * = alphanumeric)">
        <div style={colStyle}>
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
        </div>
      </Block>
    </Section>
  )
}
