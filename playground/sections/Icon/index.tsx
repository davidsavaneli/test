import { useMemo, useRef, useState } from 'react'
import { Icon, TextField, Typography } from '../../../src'
import { icons } from '../../../src/icons/icons'
import type { IconName } from '../../../src/icons/names'
import { Section } from '../../shared'
import styles from './gallery.module.css'

// The full registry, derived once. Keys are every `IconName` (~1195 entries).
const ALL_ICONS = Object.keys(icons) as IconName[]

export function IconSection() {
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_ICONS
    return ALL_ICONS.filter((name) => name.toLowerCase().includes(q))
  }, [query])

  const copy = (name: string) => {
    navigator.clipboard?.writeText(name)
    setCopied(name)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(null), 1200)
  }

  return (
    <Section title="Icon">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          adornment={<Icon name="SearchNormal" />}
          placeholder="Search icons…"
          aria-label="Search icons"
        />
        <Typography variant="bodySmall" color="tertiary">
          {filtered.length} of {ALL_ICONS.length} icons · click any icon to copy its name
        </Typography>

        {filtered.length === 0 ? (
          <Typography className={styles.empty}>No icons match “{query}”.</Typography>
        ) : (
          <div className={styles.grid}>
            {filtered.map((name) => (
              <button
                key={name}
                type="button"
                className={styles.card}
                onClick={() => copy(name)}
                title={`Copy “${name}”`}
              >
                <Icon name={name} size="lg" />
                <span
                  className={copied === name ? `${styles.label} ${styles.copied}` : styles.label}
                >
                  {copied === name ? 'Copied!' : name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Section>
  )
}
