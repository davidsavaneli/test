import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, ThemeProvider, ThemeToggle, useTheme, type ThemeConfig } from '../src'
import '../src/styles/reset.css'
import '../src/styles/theme.css'

const themeConfig: ThemeConfig = {
  mode: 'light',
  colors: {
    light: {
      primary: '#33404e', secondary: '#ffffff', tertiary: '#74797e',
      dark: '#127f8b', medium: '#2aa1af', light: '#71c6c9',
      success: '#00a854', error: '#f04134', info: '#00a2ae', warning: '#ffbf00',
    },
    dark: {
      secondary: '#141b22',
    },
  },
}

const swatches = [
  'primary', 'secondary', 'tertiary', 'dark', 'medium', 'light',
  'success', 'error', 'info', 'warning',
] as const

function Demo() {
  const { mode } = useTheme()

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
        maxWidth: 880,
        margin: '0 auto',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>@techzy/ui playground</h1>
        <ThemeToggle />
      </header>

      <p style={{ margin: 0, color: 'var(--tz-color-text-muted)' }}>
        მიმდინარე თემა: <strong style={{ color: 'var(--tz-color-text)' }}>{mode}</strong>
      </p>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15 }}>Button — variants</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15 }}>Button — sizes</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15 }}>Color tokens</h2>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {swatches.map((c) => (
            <div
              key={c}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 72 }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 8,
                  backgroundColor: `var(--tz-color-${c})`,
                  border: '1px solid var(--tz-color-border)',
                }}
              />
              <span style={{ fontSize: 11, color: 'var(--tz-color-text-muted)' }}>{c}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider config={themeConfig}>
      <Demo />
    </ThemeProvider>
  </StrictMode>,
)
