import { useState } from 'react'
import { ChoiceCard, ChoiceCardGroup, Typography, type ChoiceCardOption } from '../../../src'
import { Block, Section } from '../../shared'

const ROLES: ChoiceCardOption[] = [
  { value: 'admin', label: 'Admin', description: 'Give full access', icon: 'ShieldTick' },
  { value: 'user', label: 'User', description: 'Give limited access', icon: 'User' },
  { value: 'guest', label: 'Guest', description: 'Give read-only access', icon: 'Global' },
  { value: 'blocked', label: 'Blocked', description: 'No access', icon: 'Lock' },
]

const ADDONS: ChoiceCardOption[] = [
  { value: 'storage', label: 'Extra Storage', description: '+100 GB', icon: 'Cloud' },
  { value: 'compute', label: 'Compute Boost', description: '2× CPU', icon: 'Cpu' },
  { value: 'priority', label: 'Priority Support', description: '24/7 SLA', icon: 'Flash' },
  { value: 'backup', label: 'Daily Backups', description: '30-day history', icon: 'Data' },
]

export function ChoiceCardSection() {
  const [role, setRole] = useState<string | string[] | null>('user')
  const [addons, setAddons] = useState<string | string[] | null>(['storage'])

  return (
    <Section>
      {/* exclusive — radio semantics */}
      <Block
        label="Exclusive (radio)"
        description="exclusive — one card at a time (native radios: Arrow keys rove, Space selects). value is a string."
      >
        <ChoiceCardGroup
          exclusive
          options={ROLES}
          value={role}
          onChange={setRole}
          aria-label="Role"
        />
        <Typography variant="bodySmall" color="muted" as="div">
          Selected: {String(role)}
        </Typography>
      </Block>

      {/* multiple — checkbox semantics */}
      <Block
        label="Multiple (checkbox)"
        description="The default mode — pick any number of cards. value is a string[]."
      >
        <ChoiceCardGroup
          options={ADDONS}
          value={addons}
          onChange={setAddons}
          aria-label="Add-ons"
        />
        <Typography variant="bodySmall" color="muted" as="div">
          Selected: {Array.isArray(addons) ? addons.join(', ') || '—' : String(addons)}
        </Typography>
      </Block>

      {/* without icons — content left-aligned automatically */}
      <Block
        label="Without Icons"
        description="A card with no icon left-aligns its content automatically — a compact list-row look (no prop needed)."
      >
        <ChoiceCardGroup
          exclusive
          defaultValue="pro"
          options={[
            { value: 'free', label: 'Free', description: '1 project · community support' },
            { value: 'pro', label: 'Pro', description: 'Unlimited projects · email support' },
            { value: 'team', label: 'Team', description: 'SSO · roles · priority support' },
          ]}
          aria-label="Plan"
        />
      </Block>

      {/* left-aligned WITH icons — the same stack, anchored left */}
      <Block
        label="Left-Aligned With Icons"
        description="align='left' works with icons too — the same stacked layout as center (icon above label above description), just anchored to the left edge (a card's own align wins over the group's)."
      >
        <ChoiceCardGroup
          exclusive
          align="left"
          defaultValue="user"
          options={ROLES.slice(0, 3)}
          aria-label="Role (left-aligned)"
        />
      </Block>

      {/* group label + required + disabled option */}
      <Block
        label="Label, Required & Disabled"
        description="A group label with the required asterisk; a per-card disabled (Blocked) can't be picked."
      >
        <ChoiceCardGroup
          exclusive
          label="Access Level"
          required
          defaultValue="guest"
          options={[...ROLES.slice(0, 3), { ...ROLES[3], disabled: true }]}
        />
      </Block>

      {/* sizes */}
      <Block
        label="Sizes"
        description="sm · md · lg — padding, icon circle and fonts scale together."
      >
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <div key={size} style={{ marginBottom: 'var(--tz-space-md)' }}>
            <Typography variant="caption" color="muted" as="div" style={{ marginBottom: 4 }}>
              {size}
            </Typography>
            <ChoiceCardGroup
              exclusive
              size={size}
              defaultValue="user"
              options={ROLES.slice(0, 3)}
              aria-label={`${size} roles`}
            />
          </div>
        ))}
      </Block>

      {/* colors + error */}
      <Block
        label="Color & Error"
        description="color tints the selected card (border, halo, icon circle, tick); error reddens the borders — the validation look."
      >
        <ChoiceCardGroup
          color="success"
          defaultValue={['compute']}
          options={ADDONS.slice(0, 3)}
          aria-label="Green add-ons"
        />
        <div style={{ marginTop: 'var(--tz-space-sm)' }}>
          <ChoiceCardGroup
            exclusive
            error
            label="Pick a role"
            required
            options={ROLES.slice(0, 3)}
            aria-label="Erroring roles"
          />
        </div>
      </Block>

      {/* standalone card */}
      <Block
        label="Standalone"
        description="A single ChoiceCard works alone as a rich checkbox (checked + onChange) — e.g. an agree-to-terms card."
      >
        <div style={{ maxWidth: 260 }}>
          <ChoiceCard
            value="terms"
            label="Accept Terms"
            description="I agree to the terms of service"
            icon="TickSquare"
          />
        </div>
      </Block>
    </Section>
  )
}
