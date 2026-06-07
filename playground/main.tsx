import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, type ThemeConfig } from '../src'
import '../src/styles/reset.css'
import '../src/styles/theme.css'
import '../src/styles/general.css'
import { ShellDemo } from './sections/AdminShell'

const themeConfig: ThemeConfig = {
  mode: 'light',
  colors: {
    light: {
      primary: '#13404e',
      secondary: '#f4f9f8',
      dark: '#056472',
      medium: '#039aa1',
      light: '#adc3c9',
      success: '#00a854',
      error: '#f04134',
      info: '#039aa1',
      warning: '#ffbf00',
    },
    dark: {
      secondary: '#04202b',
    },
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider config={themeConfig}>
      <ShellDemo />
    </ThemeProvider>
  </StrictMode>,
)
