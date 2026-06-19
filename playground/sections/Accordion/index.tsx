import { useState } from 'react'
import { Accordion, AccordionItem, type AccordionItemData, Col, Typography } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

const FAQ: AccordionItemData[] = [
  {
    value: 'shipping',
    label: 'How long does shipping take?',
    content: 'Orders ship within 1–2 business days and arrive in 3–5 days.',
  },
  {
    value: 'returns',
    label: 'What is the return policy?',
    content: 'Returns are accepted within 30 days of delivery, no questions asked.',
  },
  {
    value: 'support',
    label: 'How do I contact support?',
    content: 'Reach us any time at support@techzy.app — we reply within a day.',
  },
]

const SETTINGS: AccordionItemData[] = [
  {
    value: 'profile',
    label: 'Profile',
    icon: 'User',
    content: 'Name, email, and avatar settings.',
  },
  {
    value: 'security',
    label: 'Security',
    icon: 'ShieldTick',
    content: 'Password and two-factor auth.',
  },
  {
    value: 'notifications',
    label: 'Notifications',
    icon: 'Notification',
    content: 'Email and in-app notification preferences.',
  },
]

export function AccordionSection() {
  const [open, setOpen] = useState<string | null>('shipping')

  return (
    <Section>
      <Block
        label="Multi-open (default) — uncontrolled"
        description="Several panels can be open at once; bodies fold with the grid-rows animation."
      >
        <Accordion items={FAQ} defaultValue={['shipping']} />
      </Block>

      <Block
        label="Exclusive — single-open (controlled)"
        description="Opening one closes the others; value is a string | null."
      >
        <Col gap={8}>
          <Accordion
            items={FAQ}
            exclusive
            value={open}
            onChange={(v) => setOpen(v as string | null)}
          />
          <Typography variant="bodySmall" color="muted">
            open: {open ?? 'none'}
          </Typography>
        </Col>
      </Block>

      <Block label="With icons">
        <Accordion items={SETTINGS} defaultValue={['profile']} />
      </Block>

      <Block label="Sizes — sm / md / lg">
        <Col gap={16}>
          {SIZES.map((s) => (
            <Accordion key={s} size={s} items={SETTINGS.slice(0, 2)} defaultValue={['profile']} />
          ))}
        </Col>
      </Block>

      <Block label="Children API + a disabled panel">
        <Accordion defaultValue={['one']}>
          <AccordionItem value="one" label="First panel">
            Composed via <code>&lt;AccordionItem&gt;</code> children instead of the items prop.
          </AccordionItem>
          <AccordionItem value="two" label="Second panel">
            Each item carries its own value and body.
          </AccordionItem>
          <AccordionItem value="three" label="Disabled panel" disabled>
            You won't see this — the header is disabled.
          </AccordionItem>
        </Accordion>
      </Block>

      <Block label="Disabled group">
        <Accordion items={SETTINGS.slice(0, 2)} disabled defaultValue={['profile']} />
      </Block>
    </Section>
  )
}
