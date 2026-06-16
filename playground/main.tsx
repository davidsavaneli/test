import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, type Config } from '../src'
import '../src/styles/reset.css'
import '../src/styles/theme.css'
import '../src/styles/general.css'
import { ShellDemo } from './sections/AdminShell'

const config: Config = {
  locales: [
    { code: 'en-US', label: 'English' },
    { code: 'ka-GE', label: 'ქართული' },
  ],
  // configurable key / query-param names the components read (grows: page, size, …)
  keys: {
    tabQueryKey: 'tab', // top-level <Tabs> URL query param, e.g. ?tab=… (try 'view')
    nestedTabQueryKey: 'nestedTab', // a <Tabs> nested in another tab's panel, e.g. ?nestedTab=…
    translationsNamespace: 'translations', // <TranslatedFields> namespace, e.g. translations[en-US].title (try 'languages')
  },
  theme: {
    mode: 'light',
    colors: {
      light: {
        primary: '#13404e',
        secondary: '#ffffff',
        background: '#ffffff',
        surface: '#ffffff',
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
        secondary: '#131b22',
        background: '#131b22',
        surface: '#131b22',
        dark: '#0e8896',
        medium: '#16a6b4',
        light: '#25bac8',
        success: '#00a854',
        error: '#f04134',
        info: '#039aa1',
        warning: '#ffbf00',
      },
    },
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider config={config}>
      <ShellDemo />
    </ConfigProvider>
  </StrictMode>,
)
