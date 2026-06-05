import type { ComponentType } from 'react'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { FirstRouteRedirect, Icon, PageLayout, RootLayout, Typography } from '../../../src'
import { BadgeSection } from '../Badge'
import { ButtonSection } from '../Button'
import { CheckboxSection } from '../Checkbox'
import { FormSection } from '../Form'
import { IconButtonSection } from '../IconButton'
import { IconSection } from '../Icon'
import { LoaderSection } from '../Loader'
import { NumberFieldSection } from '../NumberField'
import { TextFieldSection } from '../TextField'
import { TooltipSection } from '../Tooltip'
import { TypographySection } from '../Typography'

/* Admin shell demo (RootLayout + auto Sidebar + auto Breadcrumbs + PageLayout).
   RootLayout/Sidebar/Breadcrumbs need a TanStack Router. We build a tiny code-based router whose routes
   carry `staticData` — exactly how a file-based consumer app would. The sidebar + breadcrumb trail
   generate themselves from these routes; the content area stacks breadcrumbs → page title → the page,
   and each page wraps its body in `PageLayout`. */

// Wrap a page body in PageLayout — exactly how a consuming app renders a route's content.
const inPage = (Body: ComponentType) => () => (
  <PageLayout>
    <Body />
  </PageLayout>
)

const shellRoot = createRootRoute({
  component: () => (
    <RootLayout
      logo={
        <>
          <Icon name="Box" color="primary" size="lg" />
          <Typography variant="h4">Techzy Admin</Typography>
        </>
      }
      header={{ theme: true, onLogout: () => alert('Logout clicked') }}
    >
      <Outlet />
    </RootLayout>
  ),
})

const shellIndexRoute = createRoute({
  getParentRoute: () => shellRoot,
  path: '/',
  component: FirstRouteRedirect,
})

// `/icons` — top-level link: the full icon gallery with search + click-to-copy.
const iconsRoute = createRoute({
  getParentRoute: () => shellRoot,
  path: 'icons',
  staticData: { name: 'Icons', icon: 'Category2', order: 1 },
  component: inPage(IconSection),
})

// `/components` — a module container (renders its child pages; not a page itself).
const componentsRoute = createRoute({
  getParentRoute: () => shellRoot,
  path: 'components',
  staticData: { name: 'Components', icon: 'Box', order: 1 },
  component: () => <Outlet />,
})

// Group: General components.
const generalRoute = createRoute({
  getParentRoute: () => componentsRoute,
  path: 'general',
  staticData: { name: 'General', icon: 'Grid2', order: 0 },
  component: () => <Outlet />,
})
const buttonRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'button',
  staticData: { name: 'Button', icon: 'Magicpen', order: 0 },
  component: inPage(ButtonSection),
})
const iconButtonRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'icon-button',
  staticData: { name: 'Icon Button', icon: 'Brush', order: 1 },
  component: inPage(IconButtonSection),
})
const typographyRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'typography',
  staticData: { name: 'Typography', icon: 'TextBlock', order: 2 },
  component: inPage(TypographySection),
})
const loaderRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'loader',
  staticData: { name: 'Loader', icon: 'Routing', order: 3 },
  component: inPage(LoaderSection),
})
const badgeRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'badge',
  staticData: { name: 'Badge', icon: 'Notification', order: 4 },
  component: inPage(BadgeSection),
})
const tooltipRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'tooltip',
  staticData: { name: 'Tooltip', icon: 'MessageText', order: 5 },
  component: inPage(TooltipSection),
})

// Group: Form controls.
const formsRoute = createRoute({
  getParentRoute: () => componentsRoute,
  path: 'forms',
  staticData: { name: 'Forms', icon: 'DocumentText', order: 1 },
  component: () => <Outlet />,
})
const textFieldRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'text-field',
  staticData: { name: 'Text Field', icon: 'Edit2', order: 0 },
  component: inPage(TextFieldSection),
})
const numberFieldRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'number-field',
  staticData: { name: 'Number Field', icon: 'Keyboard', order: 1 },
  component: inPage(NumberFieldSection),
})
const checkboxRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'checkbox',
  staticData: { name: 'Checkbox', icon: 'TickSquare', order: 2 },
  component: inPage(CheckboxSection),
})
const formRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'form',
  staticData: { name: 'Form', icon: 'Edit', order: 3 },
  component: inPage(FormSection),
})

const shellRouter = createRouter({
  routeTree: shellRoot.addChildren([
    shellIndexRoute,
    iconsRoute,
    componentsRoute.addChildren([
      generalRoute.addChildren([
        buttonRoute,
        iconButtonRoute,
        typographyRoute,
        loaderRoute,
        badgeRoute,
        tooltipRoute,
      ]),
      formsRoute.addChildren([textFieldRoute, numberFieldRoute, checkboxRoute, formRoute]),
    ]),
  ]),
  // Open on the icon gallery so it's visible right away.
  history: createMemoryHistory({ initialEntries: ['/icons'] }),
})

export function ShellDemo() {
  return <RouterProvider router={shellRouter} />
}
