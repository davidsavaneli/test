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
      secondary: '#ffffff',
      background: '#ffffff',
      dark: '#033b44',
      medium: '#056472',
      light: '#039aa1',
      success: '#00a854',
      error: '#f04134',
      info: '#039aa1',
      warning: '#ffbf00',
    },
    dark: {
      primary: '#e6e8eb',
      secondary: '#1F1F1E',
      background: '#1F1F1E',
      dark: '#0e8896',
      medium: '#16a6b4',
      light: '#25bac8',
      success: '#00a854',
      error: '#f04134',
      info: '#039aa1',
      warning: '#ffbf00',
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
