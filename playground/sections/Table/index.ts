// Table playground — the app-wide query-config demo in both modes: server (fetches DummyJSON) and local
// (client-side). Both pass NO `queryMapping`, so the request URL + the URL-synced address bar are built
// straight from `config.table.query` in main.tsx, and match one-to-one.
export { TableConfigQueryPage } from './TableConfigQueryPage'
export { TableConfigQueryLocalPage } from './TableConfigQueryLocalPage'
