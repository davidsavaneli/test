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
  // how a <Table> builds its SERVER-REQUEST query (state.params/query) — the backend-transport names,
  // separate from the URL keys above. App-wide default; a table can override via its queryMapping prop
  // (e.g. TableServerPage passes DummyJSON's shape, which wins over this).
  table: {
    query: {
      // each field shows its active default, with a commented alternative under it
      page: 'page', // page / offset param name
      // page: 'skip',
      size: 'size', // page-size param name
      // size: 'limit',
      search: 'search', // search param name
      // search: 'q',
      sort: 'sort', // sort-key param name
      // sort: 'sortBy',
      pagination: 'page', // page=2
      // pagination: 'offset', // skip=(page-1)*size
      sortFormat: 'field', // sort=-price
      // sortFormat: 'separate', // sortBy=price&order=desc
      // sortFormat: 'suffix', // sort=priceAsc / sort=priceDesc
      sortOrderKey: 'order', // direction param (sortFormat: 'separate')
      // sortOrderKey: 'direction',
      ascValue: 'asc', // asc value (sortFormat: 'separate' / 'suffix')
      // ascValue: 'ASC',
      descValue: 'desc', // desc value (sortFormat: 'separate' / 'suffix')
      // descValue: 'DESC',
      multiSelectFormat: 'repeat', // cat=a&cat=b
      // multiSelectFormat: 'csv', // cat=a,b
      // multiSelectFormat: 'indexed', // cat[0]=a&cat[1]=b
      rangeMinSuffix: 'From', // range lower bound → priceFrom
      // rangeMinSuffix: 'Min', // priceMin
      // rangeMinSuffix: '_gte', // price_gte
      // rangeMinSuffix: '[gte]', // price[gte]
      rangeMaxSuffix: 'To', // range upper bound → priceTo
      // rangeMaxSuffix: 'Max', // priceMax
      // rangeMaxSuffix: '_lte', // price_lte
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
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider config={config}>
      <ShellDemo />
    </ConfigProvider>
  </StrictMode>,
)
