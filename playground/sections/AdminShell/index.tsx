import type { ComponentType, ReactNode } from 'react'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
import {
  Button,
  FirstRouteRedirect,
  Icon,
  PageLayout,
  RootLayout,
  type IconName,
} from '../../../src'
import { ToastSection } from '../Toast'
import { EmptyStateSection } from '../EmptyState'
import { AccordionSection } from '../Accordion'
import { AvatarSection } from '../Avatar'
import { BadgeSection } from '../Badge'
import { ChipSection } from '../Chip'
import { DividerSection } from '../Divider'
import { LayoutSection } from '../Layout'
import { ListSection } from '../List'
import { ModalSection } from '../Modal'
import { ToggleButtonSection } from '../ToggleButton'
import { SpeedDialSection } from '../SpeedDial'
import { PopoverSection } from '../Popover'
import { PaginationSection } from '../Pagination'
import { RemoveDialogSection } from '../RemoveDialog'
import { AlertSection } from '../Alert'
import { DropdownSection } from '../Dropdown'
import { TabsSection } from '../Tabs'
import { ButtonSection } from '../Button'
import { CardSection } from '../Card'
import { CheckboxSection } from '../Checkbox'
import { DatePickerSection } from '../DatePicker'
import { DateTimePickerSection } from '../DateTimePicker'
import { TimePickerSection } from '../TimePicker'
import { RadioSection } from '../Radio'
import { RichTextEditorSection } from '../RichTextEditor'
import { SwitchSection } from '../Switch'
import { ColorPickerSection } from '../ColorPicker'
import { FormSection, FormDataSection, FormEditSection } from '../Form'
import { IconButtonSection } from '../IconButton'
import { IconSection } from '../Icon'
import { LoaderSection } from '../Loader'
import { MultilineTextFieldSection } from '../MultilineTextField'
import { MultiSelectSection } from '../MultiSelect'
import { NumberFieldSection } from '../NumberField'
import { SelectSection } from '../Select'
import { TagsFieldSection } from '../TagsField'
import { TextFieldSection } from '../TextField'
import { TooltipSection } from '../Tooltip'
import { TypographySection } from '../Typography'
import { UserDetailBody, UserFormBody, UsersListBody } from '../Users'

/* Admin shell demo (RootLayout + auto Sidebar + auto Breadcrumbs + PageLayout).
   RootLayout/Sidebar/Breadcrumbs need a TanStack Router. We build a tiny code-based router whose routes
   carry `staticData` — exactly how a file-based consumer app would. The sidebar + breadcrumb trail
   generate themselves from these routes; the content area stacks breadcrumbs → page title → the page,
   and each page wraps its body in `PageLayout`. */

// The deepest matched route's `staticData` (name + icon) — same lookup as the shell's `usePageTitle`,
// so each PageLayout header mirrors the page the breadcrumbs/sidebar already name.
function useActivePage(): { name?: string; icon?: IconName } {
  const router = useRouter()
  const matches = useRouterState({ select: (s) => s.matches })
  for (let i = matches.length - 1; i >= 0; i--) {
    const sd = router.looseRoutesById[matches[i].routeId]?.options?.staticData
    if (sd?.name) return { name: sd.name, icon: sd.icon }
  }
  return {}
}

// Wrap a page body in PageLayout — exactly how a consuming app renders a route's content. The header
// (icon + title) is derived from the route's `staticData`; pass `subtitle`/`actions` to enrich it.
// The shell still shows its auto page-title (`h2`) above, so the heading reads both there and here.
function PageContainer({
  Body,
  subtitle,
  actions,
}: {
  Body: ComponentType
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  const { name, icon } = useActivePage()
  return (
    <PageLayout icon={icon} title={name} subtitle={subtitle} actions={actions}>
      <Body />
    </PageLayout>
  )
}

const inPage =
  (Body: ComponentType, opts?: { subtitle?: ReactNode; actions?: ReactNode }) => () => (
    <PageContainer Body={Body} subtitle={opts?.subtitle} actions={opts?.actions} />
  )

// Test brand logo (the Techzy wordmark). `fill="currentColor"` so it follows the theme text color.
function TechzyLogo() {
  return (
    <svg
      width={935}
      height={186}
      viewBox="0 0 935 186"
      fill="currentColor"
      role="img"
      aria-label="Techzy"
      style={{ display: 'block', maxWidth: 130, maxHeight: 32 }}
    >
      <path d="M793.727 186L819.643 134L771 35H798.511L832.801 107.8H833.199L867.289 35H895L821.238 186H793.727Z" />
      <path d="M649 141V121.4L724.811 56.4V56H652V35H761.416V54.6L685.805 119.6V120H762V141H649Z" />
      <path d="M526 141V1H550.889V46H551.29C560.122 37 572.767 32 587.219 32C617.527 32 638 51.2 638 79.2V141H613.111V83C613.111 65.2 601.871 54.2 582.803 54.2C563.735 54.2 550.889 66.2 550.889 83.2V141H526Z" />
      <path d="M403 88C403 56.2 428.245 32 460.903 32C474.327 32 485.948 35.4 495.766 42.2C505.583 49.2 511.995 58.2 515 69.6L491.758 76C487.15 61.8 476.131 53.8 460.903 53.8C442.07 53.8 427.844 67.8 427.844 88C427.844 108.2 442.07 122.2 460.903 122.2C476.331 122.2 487.15 114.6 491.758 100L515 106.4C511.995 117.8 505.583 126.8 495.766 133.6C485.948 140.6 474.327 144 460.903 144C428.245 144 403 119.8 403 88Z" />
      <path d="M280 88.4C280 55.4 304.085 32 337.201 32C371.32 32 394 56.4 394 88.6V96H304.687C305.489 112.6 318.937 123.4 338.405 123.4C352.655 123.4 363.292 117.6 373.127 105.4L389.785 120.2C377.542 136 360.482 144 338.606 144C302.68 144 280 122 280 88.4ZM305.088 78H369.514C368.109 63 355.063 52.6 337.602 52.6C319.739 52.6 306.694 63 305.088 78Z" />
      <path d="M224.441 141V25H174V1H301V25H250.16V141H224.441Z" />
      <path d="M43 27.9997H0V-0.000266043C2.93706 -0.000266043 14.6294 -0.000766079 44 -0.000266043C67.5 0.000134045 84 16.5001 84 39.9997V99.9997C84 107 90 113 97 113H139V141L135.059 141C128.676 141 116.263 141 96 141C71 141 56 123 56 101V40.9997C56 33.9997 50 27.9997 43 27.9997Z" />
      <path d="M96 27.9997V-0.000266043H139V27.9997H96Z" />
      <path d="M917 129C926.941 129 935 137.07 935 146.976C935 156.93 926.941 165 917 165C907.059 165 899 156.93 899 146.976C899 137.07 907.059 129 917 129ZM917 161.617C925.011 161.617 931.574 155.046 931.574 146.976C931.574 139.003 925.011 132.431 917 132.431C908.989 132.431 902.426 139.003 902.426 146.976C902.426 155.046 908.989 161.617 917 161.617ZM924.866 144.028C924.866 146.638 923.66 148.426 921.44 149.247L925.349 155.626H920.185L916.855 149.73H914.056V155.626H909.568V138.326H918.399C922.501 138.326 924.866 140.452 924.866 144.028ZM914.056 146.299H917.531C919.316 146.299 920.233 145.43 920.233 144.028C920.233 142.627 919.316 141.805 917.531 141.805H914.056V146.299Z" />
    </svg>
  )
}

const shellRoot = createRootRoute({
  component: () => (
    <RootLayout
      logo={<TechzyLogo />}
      header={{
        theme: true,
        onLogout: () => alert('Logout clicked'),
        user: { name: 'David Savaneli', email: 'd.savaneli@techzy.app' },
      }}
    >
      {/* RootLayout mounts the <Toaster> by default, so toast.*() works on every page */}
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
  staticData: { name: 'Icons', icon: 'Category2', order: 1, dot: 'error' },
  component: inPage(IconSection),
})

// `/users` — a normal top-level page (in the sidebar) that owns a DYNAMIC detail route.
const usersRoute = createRoute({
  getParentRoute: () => shellRoot,
  path: 'users',
  staticData: { name: 'Users', icon: 'People', order: 2 },
  component: () => <Outlet />,
})
// `/users/` (index) — the list page shown at /users.
const usersIndexRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: '/',
  component: inPage(UsersListBody),
})
// `/users/new` — add form (static segment wins over the `$userId` param).
const userNewRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: 'new',
  component: inPage(UserFormBody),
})
// `/users/$userId` — DYNAMIC detail. No `staticData.name` ⇒ routed + rendered, but never in the sidebar.
const userDetailRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: '$userId',
  component: inPage(UserDetailBody),
})
// `/users/$userId/edit` — DYNAMIC update form. Also off the sidebar.
const userEditRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: '$userId/edit',
  component: inPage(UserFormBody),
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
  staticData: { name: 'General', icon: 'Grid2', order: 0, badge: 'New' },
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
const avatarRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'avatar',
  staticData: { name: 'Avatar', icon: 'User', order: 6 },
  component: inPage(AvatarSection),
})
const dividerRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'divider',
  staticData: { name: 'Divider', icon: 'RowHorizontal', order: 7 },
  component: inPage(DividerSection),
})
const chipRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'chip',
  staticData: { name: 'Chip', icon: 'Tag', order: 8 },
  component: inPage(ChipSection),
})
const layoutRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'layout',
  staticData: { name: 'Layout (Row/Col)', icon: 'Grid3', order: 9 },
  component: inPage(LayoutSection),
})
const cardRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'card',
  staticData: { name: 'Card', icon: 'Cards', order: 10 },
  component: inPage(CardSection),
})
const listRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'list',
  staticData: { name: 'List', icon: 'RowVertical', order: 11 },
  component: inPage(ListSection),
})
const dropdownRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'dropdown',
  staticData: { name: 'Dropdown', icon: 'ArrowSquareDown', order: 12 },
  component: inPage(DropdownSection),
})
const tabsRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'tabs',
  staticData: { name: 'Tabs', icon: 'RowHorizontal', order: 13 },
  component: inPage(TabsSection),
})
const modalRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'modal',
  staticData: { name: 'Modal', icon: 'Maximize3', order: 14 },
  component: inPage(ModalSection),
})
const toggleButtonRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'toggle-button',
  staticData: { name: 'Toggle Button', icon: 'Category2', order: 15 },
  component: inPage(ToggleButtonSection),
})
const speedDialRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'speed-dial',
  staticData: { name: 'Speed Dial', icon: 'AddCircle', order: 16 },
  component: inPage(SpeedDialSection),
})
const popoverRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'popover',
  staticData: { name: 'Popover', icon: 'Filter', order: 17 },
  component: inPage(PopoverSection),
})
const paginationRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'pagination',
  staticData: { name: 'Pagination', icon: 'More', order: 18 },
  component: inPage(PaginationSection),
})
const removeDialogRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'remove-dialog',
  staticData: { name: 'Remove Dialog', icon: 'Trash', order: 19 },
  component: inPage(RemoveDialogSection),
})
const alertRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'alert',
  staticData: { name: 'Alert', icon: 'InfoCircle', order: 20 },
  component: inPage(AlertSection),
})
const toastRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'toast',
  staticData: { name: 'Toast', icon: 'NotificationBing', order: 21 },
  component: inPage(ToastSection),
})
const emptyStateRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'empty-state',
  staticData: { name: 'Empty State', icon: 'Box', order: 22 },
  component: inPage(EmptyStateSection),
})
const accordionRoute = createRoute({
  getParentRoute: () => generalRoute,
  path: 'accordion',
  staticData: { name: 'Accordion', icon: 'ArrowDown3', order: 23 },
  component: inPage(AccordionSection),
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
const multilineTextFieldRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'multiline-text-field',
  staticData: { name: 'Multiline Text Field', icon: 'TextalignLeft', order: 1 },
  component: inPage(MultilineTextFieldSection),
})
const tagsFieldRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'tags-field',
  staticData: { name: 'Tags Field', icon: 'Tag', order: 2 },
  component: inPage(TagsFieldSection),
})
const numberFieldRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'number-field',
  staticData: { name: 'Number Field', icon: 'Keyboard', order: 3 },
  component: inPage(NumberFieldSection),
})
const checkboxRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'checkbox',
  staticData: { name: 'Checkbox', icon: 'TickSquare', order: 4 },
  component: inPage(CheckboxSection),
})
const radioRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'radio',
  staticData: { name: 'Radio', icon: 'RecordCircle', order: 5 },
  component: inPage(RadioSection),
})
const switchRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'switch',
  staticData: { name: 'Switch', icon: 'ToggleOnCircle', order: 6 },
  component: inPage(SwitchSection),
})
const colorPickerRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'color-picker',
  staticData: { name: 'Color Picker', icon: 'ColorSwatch', order: 7 },
  component: inPage(ColorPickerSection),
})
const selectRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'select',
  staticData: { name: 'Select', icon: 'ArrowDown4', order: 8 },
  component: inPage(SelectSection),
})
const multiSelectRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'multi-select',
  staticData: { name: 'Multi Select', icon: 'TaskSquare', order: 9 },
  component: inPage(MultiSelectSection),
})
const datePickerRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'date-picker',
  staticData: { name: 'Date Picker', icon: 'Calendar', order: 10 },
  component: inPage(DatePickerSection),
})
const dateTimePickerRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'date-time-picker',
  staticData: { name: 'Date Time Picker', icon: 'Calendar3', order: 11 },
  component: inPage(DateTimePickerSection),
})
const timePickerRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'time-picker',
  staticData: { name: 'Time Picker', icon: 'Clock', order: 12 },
  component: inPage(TimePickerSection),
})
const richTextEditorRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'rich-text-editor',
  staticData: { name: 'Rich Text Editor', icon: 'DocumentText', order: 13 },
  component: inPage(RichTextEditorSection),
})
const formRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'form',
  staticData: { name: 'Form (JSON)', icon: 'Edit', order: 14 },
  component: inPage(FormSection, {
    subtitle: 'Zod-validated form — Submit POSTs nested JSON.',
    actions: (
      <Button size="sm" variant="outlined" startIcon={<Icon name="DocumentText" />}>
        Docs
      </Button>
    ),
  }),
})
const formDataRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'form-data',
  staticData: { name: 'Form (FormData)', icon: 'DocumentUpload', order: 15 },
  component: inPage(FormDataSection, {
    subtitle: 'Same form — Submit POSTs multipart/form-data.',
  }),
})
const formEditRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'form-edit',
  staticData: { name: 'Form (Edit)', icon: 'Translate', order: 16 },
  component: inPage(FormEditSection, {
    subtitle: 'Edit mode — prefilled values, translations flattened in.',
  }),
})

const shellRouter = createRouter({
  routeTree: shellRoot.addChildren([
    shellIndexRoute,
    iconsRoute,
    usersRoute.addChildren([usersIndexRoute, userNewRoute, userDetailRoute, userEditRoute]),
    componentsRoute.addChildren([
      generalRoute.addChildren([
        buttonRoute,
        iconButtonRoute,
        typographyRoute,
        loaderRoute,
        badgeRoute,
        tooltipRoute,
        avatarRoute,
        dividerRoute,
        chipRoute,
        layoutRoute,
        cardRoute,
        listRoute,
        dropdownRoute,
        tabsRoute,
        modalRoute,
        toggleButtonRoute,
        speedDialRoute,
        popoverRoute,
        paginationRoute,
        removeDialogRoute,
        alertRoute,
        toastRoute,
        emptyStateRoute,
        accordionRoute,
      ]),
      formsRoute.addChildren([
        textFieldRoute,
        multilineTextFieldRoute,
        tagsFieldRoute,
        numberFieldRoute,
        checkboxRoute,
        radioRoute,
        switchRoute,
        colorPickerRoute,
        selectRoute,
        multiSelectRoute,
        datePickerRoute,
        dateTimePickerRoute,
        timePickerRoute,
        richTextEditorRoute,
        formRoute,
        formDataRoute,
        formEditRoute,
      ]),
    ]),
  ]),
  // Open on the icon gallery so it's visible right away.
  history: createMemoryHistory({ initialEntries: ['/icons'] }),
})

export function ShellDemo() {
  return <RouterProvider router={shellRouter} />
}
