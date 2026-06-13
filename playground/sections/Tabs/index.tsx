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

// a Tabs whose panels each hold ANOTHER Tabs — the inner strips auto-pick the nested query key
const nested: TabItem[] = [
  {
    value: 'profile',
    label: 'Profile',
    icon: 'Profile',
    content: (
      <Tabs
        variant="pill"
        aria-label="Profile sub-tabs"
        items={[
          { value: 'basic', label: 'Basic', content: <p>Basic profile fields.</p> },
          { value: 'avatar', label: 'Avatar', content: <p>Avatar & cover image.</p> },
        ]}
      />
    ),
  },
  {
    value: 'billing',
    label: 'Billing',
    icon: 'Card',
    content: (
      <Tabs
        variant="pill"
        aria-label="Billing sub-tabs"
        items={[
          { value: 'plan', label: 'Plan', content: <p>Plan & pricing.</p> },
          { value: 'invoices', label: 'Invoices', content: <p>Invoice history.</p> },
        ]}
      />
    ),
  },
]

export function TabsSection() {
  const [active, setActive] = useState('account')

  return (
    <Section>
      <Block
        label="basic · controlled (active shown below)"
        description="Data-driven via items; onChange reports the active value. queryKey={null} keeps it state-only."
      >
        <Tabs
          items={basic}
          value={active}
          onChange={setActive}
          queryKey={null}
          aria-label="Settings"
        />
        <Typography variant="bodySmall" color="muted">
          Active: “{active}”
        </Typography>
      </Block>

      <Block
        label="URL query sync — on by default (?tab=…)"
        description="With no queryKey, every Tabs syncs to ?tab=… (refresh-safe). Watch the address bar as you switch. Set the param name globally via ConfigProvider's keys.tabQueryKey, or per-strip with queryKey."
      >
        <Tabs items={basic} aria-label="Query-synced" />
      </Block>

      <Block
        label="custom query name + Back navigates tabs (pushHistory)"
        description="Pick any param name (?panel=…). With pushHistory the browser Back button steps through tabs; by default it doesn't."
      >
        <Tabs items={basic} queryKey="panel" pushHistory aria-label="History-pushed" />
      </Block>

      <Block
        label="nested tabs — outer + inner don't collide"
        description="A Tabs inside another tab's panel auto-uses the nested query key (keys.nestedTabQueryKey → ?nestedTab=). The outer here sets queryKey='nested' (→ ?nested=) just to avoid clashing with the ?tab= demo above; the inner strips have no queryKey and auto-resolve to ?nestedTab=. Watch the address bar."
      >
        <Tabs items={nested} queryKey="nested" aria-label="Nested" />
      </Block>

      <Block
        label="indicators — icon · badge · dot · error · disabled"
        description="A trailing count badge, a tinted dot (dot), a red validation dot (error — no full-tab tint), and disabled tabs (skipped by keyboard)."
      >
        <Tabs items={indicators} queryKey={null} aria-label="Indicators" />
      </Block>

      <Block label="variants" description="underline (default) and pill.">
        <Tabs items={basic} variant="underline" queryKey={null} aria-label="Underline" />
        <Tabs items={basic} variant="pill" queryKey={null} aria-label="Pill" />
      </Block>

      <Block label="sizes" description="sm / md / lg.">
        {SIZES.map((s) => (
          <Tabs key={s} items={basic} size={s} queryKey={null} aria-label={`Size ${s}`} />
        ))}
      </Block>

      <Block label="full width" description="Tabs stretch to fill the strip equally.">
        <Tabs items={basic} fullWidth queryKey={null} aria-label="Full width" />
      </Block>

      <Block
        label="overflow — horizontal scroll"
        description="When the tabs don't fit, the strip scrolls horizontally and keeps the active tab in view."
      >
        <div style={{ maxWidth: 420 }}>
          <Tabs items={many} queryKey={null} aria-label="Scrollable" />
        </div>
      </Block>

      <Block label="with panels" description="Items with content render an active role=tabpanel.">
        <Tabs items={withPanels} queryKey={null} aria-label="With panels" />
      </Block>

      <Block label="vertical" description="orientation='vertical' — strip beside the panel.">
        <Tabs
          items={withPanels}
          orientation="vertical"
          variant="pill"
          queryKey={null}
          aria-label="Vertical"
        />
      </Block>
    </Section>
  )
}
