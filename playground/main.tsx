import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, Icon, Loader, ThemeProvider, ThemeToggle, useTheme, type ThemeConfig } from '../src'
import '../src/styles/reset.css'
import '../src/styles/theme.css'
import '../src/styles/general.css'

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
          <Button variant="contained">Contained</Button>
          <Button variant="filled">Filled</Button>
          <Button variant="outlined">Outlined</Button>
          <Button variant="text">Text</Button>
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15 }}>Button — colors</h2>
        {(['contained', 'filled', 'outlined'] as const).map((v) => (
          <div key={v} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {(['primary', 'success', 'error', 'warning', 'info'] as const).map((c) => (
              <Button key={c} variant={v} color={c}>{c}</Button>
            ))}
          </div>
        ))}
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
        <h2 style={{ margin: 0, fontSize: 15 }}>Button — states</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button loading>Loading</Button>
          <Button variant="outlined" color="error" loading>Deleting</Button>
          <Button disabled>Disabled</Button>
          <Button variant="outlined" disabled>Disabled</Button>
          <Button rounded>Rounded</Button>
          <Button variant="filled" color="success" rounded>Rounded</Button>
        </div>
        <Button fullWidth>Full width</Button>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15 }}>Loader — sizes</h2>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <Loader size="sm" />
          <Loader size="md" />
          <Loader size="lg" />
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15 }}>Loader — colors</h2>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          {(['primary', 'success', 'error', 'warning', 'info'] as const).map((c) => (
            <Loader key={c} color={c} size="lg" />
          ))}
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15 }}>Icon — sizes</h2>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Icon name="Home2" size="sm" />
          <Icon name="Home2" size="md" />
          <Icon name="Home2" size="lg" />
          <Icon name="Home2" style={{ width: 50, height: 50 }} />
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15 }}>Icon — colors</h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {swatches.map((c) => (
            <Icon key={c} name="Heart" color={c} size="lg" />
          ))}
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15 }}>Icon — sample set</h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {(['Setting2', 'User', 'Sms', 'Calendar', 'Camera', 'Cloud', 'Edit', 'Trash',
            'Search', 'Filter', 'Notification', 'Lock', 'Star', 'Wallet'] as const).map((n) => (
            <Icon key={n} name={n} color="dark" size="lg" />
          ))}
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15 }}>Icon — inside a Button</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="filled" color="primary">
            <Icon name="Add" color="primary" size="sm" /> ახალი
          </Button>
          <Button variant="outlined" color="error">
            <Icon name="Trash" color="error" size="sm" /> წაშლა
          </Button>
        </div>
        <span style={{ fontSize: 12, color: 'var(--tz-color-text-muted)' }}>loading — loader ცვლის აიქონ+ტექსტს:</span>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="filled" color="primary" loading>
            <Icon name="Add" color="primary" size="sm" /> ახალი
          </Button>
          <Button variant="outlined" color="error" loading>
            <Icon name="Trash" color="error" size="sm" /> წაშლა
          </Button>
          <Button variant="contained" loading>
            <Icon name="Add" size="sm" /> შენახვა
          </Button>
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
