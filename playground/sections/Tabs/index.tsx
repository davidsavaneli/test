import { useState } from 'react'
import { Tabs, Typography } from '../../../src'
import type { TabItem } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

const basic: TabItem[] = [
  { value: 'account', label: 'Account', icon: 'Profile' },
  { value: 'security', label: 'Security', icon: 'Shield' },
  { value: 'billing', label: 'Billing', icon: 'Card' },
  { value: 'advanced', label: 'Advanced', icon: 'Setting2' },
]

const withPanels: TabItem[] = [
  { value: 'overview', label: 'Overview', content: <p>The overview panel content.</p> },
  { value: 'activity', label: 'Activity', content: <p>Recent activity goes here.</p> },
  { value: 'members', label: 'Members', content: <p>Team members list.</p> },
]

const indicators: TabItem[] = [
  { value: 'inbox', label: 'Inbox', icon: 'Sms', badge: 5 },
  { value: 'alerts', label: 'Alerts', icon: 'Notification', dot: true },
  { value: 'profile', label: 'Profile', icon: 'Profile', error: true },
  { value: 'archived', label: 'Archived', disabled: true },
]

const many: TabItem[] = Array.from({ length: 12 }, (_, i) => ({
  value: `m${i + 1}`,
  label: `Section ${i + 1}`,
}))

export function TabsSection() {
  const [active, setActive] = useState('account')

  return (
    <Section>
      <Block
        label="basic · controlled (active shown below)"
        description="Data-driven via items; onChange reports the active value."
      >
        <Tabs items={basic} value={active} onChange={setActive} aria-label="Settings" />
        <Typography variant="bodySmall" color="muted">
          Active: “{active}”
        </Typography>
      </Block>

      <Block
        label="URL query sync — refresh-safe"
        description="queryKey writes ?tab=… so a page refresh restores the tab. Watch the address bar as you switch."
      >
        <Tabs items={basic} queryKey="tab" aria-label="Query-synced" />
      </Block>

      <Block
        label="custom query name + Back navigates tabs (pushHistory)"
        description="Pick any param name (?panel=…). With pushHistory the browser Back button steps through tabs; by default it doesn't."
      >
        <Tabs items={basic} queryKey="panel" pushHistory aria-label="History-pushed" />
      </Block>

      <Block
        label="indicators — icon · badge · dot · error · disabled"
        description="Per-tab Badge (count or dot), an error tint, and disabled tabs (skipped by keyboard)."
      >
        <Tabs items={indicators} aria-label="Indicators" />
      </Block>

      <Block label="variants" description="underline (default) and pill.">
        <Tabs items={basic} variant="underline" aria-label="Underline" />
        <Tabs items={basic} variant="pill" aria-label="Pill" />
      </Block>

      <Block label="sizes" description="sm / md / lg.">
        {SIZES.map((s) => (
          <Tabs key={s} items={basic} size={s} aria-label={`Size ${s}`} />
        ))}
      </Block>

      <Block label="full width" description="Tabs stretch to fill the strip equally.">
        <Tabs items={basic} fullWidth aria-label="Full width" />
      </Block>

      <Block
        label="overflow — horizontal scroll"
        description="When the tabs don't fit, the strip scrolls horizontally and keeps the active tab in view."
      >
        <div style={{ maxWidth: 420 }}>
          <Tabs items={many} aria-label="Scrollable" />
        </div>
      </Block>

      <Block label="with panels" description="Items with content render an active role=tabpanel.">
        <Tabs items={withPanels} aria-label="With panels" />
      </Block>

      <Block label="vertical" description="orientation='vertical' — strip beside the panel.">
        <Tabs items={withPanels} orientation="vertical" variant="pill" aria-label="Vertical" />
      </Block>
    </Section>
  )
}
