// Public surface. The nav engine (buildNavTree, useNavTree, usePageTitle, useBreadcrumbs, types) stays
// internal to Sidebar.tsx — RootLayout/Breadcrumbs import it directly, consumers don't.
export { Sidebar, Sidebar as default, FirstRouteRedirect } from './Sidebar'
