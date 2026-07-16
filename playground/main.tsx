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
    stepQueryKey: 'step', // <Stepper queryKey> URL param (sync is opt-in; 1-based), e.g. ?step=2 (try 'wizard')
    translationsNamespace: 'translations', // <TranslatedFields> namespace, e.g. translations[en-US].title (try 'languages')
  },
  // how a <Table> builds its SERVER-REQUEST query (state.params/query) — the backend-transport names,
  // separate from the URL keys above. App-wide default; a table can override via its queryMapping prop
  // (e.g. TableServerPage passes DummyJSON's shape, which wins over this).
  table: {
    query: {
      // each field shows its active default, with a commented alternative under it
      pageParam: 'page', // page / offset request-param name
      // pageParam: 'skip',
      sizeParam: 'size', // page-size request-param name
      // sizeParam: 'limit',
      searchParam: 'search', // search request-param name
      // searchParam: 'q',
      sortParam: 'sortBy', // sort-key request-param name
      // sortParam: 'sort',
      pagination: 'page', // page=2
      // pagination: 'offset', // skip=(page-1)*size
      sortFormat: 'separate', // sortBy=price&order=desc
      // sortFormat: 'field', // sort=-price
      // sortFormat: 'suffix', // sort=priceAsc / sort=priceDesc
      sortOrderParam: 'orderBy', // direction request-param (sortFormat: 'separate')
      // sortOrderParam: 'order',
      // sortOrderParam: 'direction',
      ascValue: 'asc', // asc value (sortFormat: 'separate' / 'suffix')
      // ascValue: 'ASC',
      descValue: 'desc', // desc value (sortFormat: 'separate' / 'suffix')
      // descValue: 'DESC',
      multiSelectFormat: 'repeat', // cat=a&cat=b
      // multiSelectFormat: 'csv', // cat=a,b
      // multiSelectFormat: 'indexed', // cat[0]=a&cat[1]=b
      rangeMinSuffix: '_gte', // range lower bound → price_gte
      // rangeMinSuffix: 'From', // priceFrom
      // rangeMinSuffix: 'Min', // priceMin
      // rangeMinSuffix: '[gte]', // price[gte]
      rangeMaxSuffix: '_lte', // range upper bound → price_lte
      // rangeMaxSuffix: 'To', // priceTo
      // rangeMaxSuffix: 'Max', // priceMax
      // rangeMaxSuffix: '[lte]', // price[lte]
      // allValue: 0, // "All" → limit=0 (default: no allValue → size param dropped on "All")
    },
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
  // RootLayout header — the STATIC top-bar toggles, app-wide (a RootLayout `header` prop merges over this).
  // The dynamic account bits (`user` + `onLogout`) are runtime/auth values, so they're passed via the
  // RootLayout `header` prop at the render site (see AdminShell), NOT hardcoded here.
  header: {
    theme: true, // ThemeToggle (default true)
    fullscreen: true, // FullscreenToggle — the maximize button (default true)
    search: true, // nav search over the sidebar pages (default true)
    breadcrumbs: false, // breadcrumb trail above the page title (default false)
    pageTitle: true, // auto page-title <h2> from the route's staticData.name (default true)
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider config={config}>
      <ShellDemo />
    </ConfigProvider>
  </StrictMode>,
)
