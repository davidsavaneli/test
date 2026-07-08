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
import { FirstRouteRedirect, PageLayout, RootLayout, type IconName } from '../../../src'
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
import { FileUploaderSection } from '../FileUploader'
import { TabsSection } from '../Tabs'
import {
  TableLocalPage,
  TableStripedPage,
  TableWrapPage,
  TableHideAllPage,
  TableSortFieldPage,
  TableSortSeparatePage,
  TableSortSuffixPage,
  TableSortOrderPage,
  TablePagePaginationPage,
  TableOffsetPaginationPage,
  TableAllValuePage,
  TableAllValueDefaultPage,
  TableRealApiPage,
  TableExportPage,
  TableFiltersPage,
  TableServerFiltersPage,
  TableEmptyPage,
} from '../Table'
import { ButtonSection } from '../Button'
import { CardSection } from '../Card'
import { CheckboxSection } from '../Checkbox'
import { DatePickerSection } from '../DatePicker'
import { DateTimePickerSection } from '../DateTimePicker'
import { TimePickerSection } from '../TimePicker'
import { RadioSection } from '../Radio'
import { RichTextEditorSection } from '../RichTextEditor'
import { SliderSection } from '../Slider'
import { SwitchSection } from '../Switch'
import { ColorPickerSection } from '../ColorPicker'
import { FormValidationsSection } from '../FormValidations'
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

// `/components/table` — an EXPANDABLE group inside Components (like Forms / Data Display): one page per
// Table example (Local / Striped / …). (`componentsRoute` is referenced lazily, resolved at tree build.)
const tableGroupRoute = createRoute({
  getParentRoute: () => componentsRoute,
  path: 'table',
  staticData: { name: 'Table', icon: 'Grid', order: 6 },
  component: () => <Outlet />,
})
const tableLocalRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'local',
  staticData: { name: 'Local', order: 0 },
  component: inPage(TableLocalPage),
})
const tableStripedRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'striped',
  staticData: { name: 'Striped + Clickable', order: 1 },
  component: inPage(TableStripedPage),
})
const tableWrapRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'wrap',
  staticData: { name: 'Wrapping', order: 2 },
  component: inPage(TableWrapPage),
})
const tableHideAllRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'hide-all',
  staticData: { name: 'Hide All', order: 3 },
  component: inPage(TableHideAllPage),
})
const tableSortFieldRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'sort-field',
  staticData: { name: 'Sort (field)', order: 4 },
  component: inPage(TableSortFieldPage),
})
const tableSortSeparateRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'sort-separate',
  staticData: { name: 'Sort (separate)', order: 5 },
  component: inPage(TableSortSeparatePage),
})
const tableSortSuffixRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'sort-suffix',
  staticData: { name: 'Sort (suffix)', order: 6 },
  component: inPage(TableSortSuffixPage),
})
const tableSortOrderRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'sort-order',
  staticData: { name: 'Sort (custom order)', order: 7 },
  component: inPage(TableSortOrderPage),
})
const tablePagePaginationRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'pagination-page',
  staticData: { name: 'Pagination (page-based)', order: 8 },
  component: inPage(TablePagePaginationPage),
})
const tableOffsetPaginationRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'pagination-offset',
  staticData: { name: 'Pagination (offset)', order: 9 },
  component: inPage(TableOffsetPaginationPage),
})
const tableAllValueRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'all-value',
  staticData: { name: 'All value (allValue: 0)', order: 10 },
  component: inPage(TableAllValuePage),
})
const tableAllValueDefaultRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'all-value-default',
  staticData: { name: 'All value (default)', order: 11 },
  component: inPage(TableAllValueDefaultPage),
})
const tableRealApiRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'real-api',
  staticData: { name: 'Real API (DummyJSON)', order: 12 },
  component: inPage(TableRealApiPage),
})
const tableExportRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'export',
  staticData: { name: 'Export (CSV + action)', order: 13 },
  component: inPage(TableExportPage),
})
const tableFiltersRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'filters',
  staticData: { name: 'Filters (Local)', order: 14 },
  component: inPage(TableFiltersPage),
})
const tableServerFiltersRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'filters-server',
  staticData: { name: 'Filters (Server)', order: 15 },
  component: inPage(TableServerFiltersPage),
})
const tableEmptyRoute = createRoute({
  getParentRoute: () => tableGroupRoute,
  path: 'empty',
  staticData: { name: 'Empty', order: 16 },
  component: inPage(TableEmptyPage),
})

// `/components` — a module container (renders its child pages; not a page itself).
const componentsRoute = createRoute({
  getParentRoute: () => shellRoot,
  path: 'components',
  staticData: { name: 'Components', icon: 'Box', order: 1 },
  component: () => <Outlet />,
})

// Group: Layouts.
const layoutsRoute = createRoute({
  getParentRoute: () => componentsRoute,
  path: 'layouts',
  staticData: { name: 'Layouts', icon: 'Grid3', order: 0 },
  component: () => <Outlet />,
})
const layoutRoute = createRoute({
  getParentRoute: () => layoutsRoute,
  path: 'layout',
  staticData: { name: 'Layout (Row/Col)', icon: 'Grid3', order: 0 },
  component: inPage(LayoutSection),
})
const cardRoute = createRoute({
  getParentRoute: () => layoutsRoute,
  path: 'card',
  staticData: { name: 'Card', icon: 'Cards', order: 1 },
  component: inPage(CardSection),
})
const dividerRoute = createRoute({
  getParentRoute: () => layoutsRoute,
  path: 'divider',
  staticData: { name: 'Divider', icon: 'RowHorizontal', order: 2 },
  component: inPage(DividerSection),
})
const accordionRoute = createRoute({
  getParentRoute: () => layoutsRoute,
  path: 'accordion',
  staticData: { name: 'Accordion', icon: 'ArrowDown3', order: 3 },
  component: inPage(AccordionSection),
})

// Group: Data Display.
const dataDisplayRoute = createRoute({
  getParentRoute: () => componentsRoute,
  path: 'data-display',
  staticData: { name: 'Data Display', icon: 'Category2', order: 2 },
  component: () => <Outlet />,
})
const typographyRoute = createRoute({
  getParentRoute: () => dataDisplayRoute,
  path: 'typography',
  staticData: { name: 'Typography', icon: 'TextBlock', order: 0 },
  component: inPage(TypographySection),
})
const avatarRoute = createRoute({
  getParentRoute: () => dataDisplayRoute,
  path: 'avatar',
  staticData: { name: 'Avatar', icon: 'User', order: 1 },
  component: inPage(AvatarSection),
})
const badgeRoute = createRoute({
  getParentRoute: () => dataDisplayRoute,
  path: 'badge',
  staticData: { name: 'Badge', icon: 'Notification', order: 2 },
  component: inPage(BadgeSection),
})
const chipRoute = createRoute({
  getParentRoute: () => dataDisplayRoute,
  path: 'chip',
  staticData: { name: 'Chip', icon: 'Tag', order: 3 },
  component: inPage(ChipSection),
})
const listRoute = createRoute({
  getParentRoute: () => dataDisplayRoute,
  path: 'list',
  staticData: { name: 'List', icon: 'RowVertical', order: 4 },
  component: inPage(ListSection),
})
const tooltipRoute = createRoute({
  getParentRoute: () => dataDisplayRoute,
  path: 'tooltip',
  staticData: { name: 'Tooltip', icon: 'MessageText', order: 5 },
  component: inPage(TooltipSection),
})
const emptyStateRoute = createRoute({
  getParentRoute: () => dataDisplayRoute,
  path: 'empty-state',
  staticData: { name: 'Empty State', icon: 'Box', order: 6 },
  component: inPage(EmptyStateSection),
})

// Group: Navigation.
const navigationRoute = createRoute({
  getParentRoute: () => componentsRoute,
  path: 'navigation',
  staticData: { name: 'Navigation', icon: 'Routing', order: 3 },
  component: () => <Outlet />,
})
const tabsRoute = createRoute({
  getParentRoute: () => navigationRoute,
  path: 'tabs',
  staticData: { name: 'Tabs', icon: 'RowHorizontal', order: 0 },
  component: inPage(TabsSection),
})
const dropdownRoute = createRoute({
  getParentRoute: () => navigationRoute,
  path: 'dropdown',
  staticData: { name: 'Dropdown', icon: 'ArrowSquareDown', order: 1 },
  component: inPage(DropdownSection),
})
const paginationRoute = createRoute({
  getParentRoute: () => navigationRoute,
  path: 'pagination',
  staticData: { name: 'Pagination', icon: 'More', order: 2 },
  component: inPage(PaginationSection),
})
const speedDialRoute = createRoute({
  getParentRoute: () => navigationRoute,
  path: 'speed-dial',
  staticData: { name: 'Speed Dial', icon: 'AddCircle', order: 3 },
  component: inPage(SpeedDialSection),
})

// Group: Feedback.
const feedbackRoute = createRoute({
  getParentRoute: () => componentsRoute,
  path: 'feedback',
  staticData: { name: 'Feedback', icon: 'Notification', order: 4 },
  component: () => <Outlet />,
})
const alertRoute = createRoute({
  getParentRoute: () => feedbackRoute,
  path: 'alert',
  staticData: { name: 'Alert', icon: 'InfoCircle', order: 0 },
  component: inPage(AlertSection),
})
const toastRoute = createRoute({
  getParentRoute: () => feedbackRoute,
  path: 'toast',
  staticData: { name: 'Toast', icon: 'NotificationBing', order: 1 },
  component: inPage(ToastSection),
})
const modalRoute = createRoute({
  getParentRoute: () => feedbackRoute,
  path: 'modal',
  staticData: { name: 'Modal', icon: 'Maximize3', order: 2 },
  component: inPage(ModalSection),
})
const removeDialogRoute = createRoute({
  getParentRoute: () => feedbackRoute,
  path: 'remove-dialog',
  staticData: { name: 'Remove Dialog', icon: 'Trash', order: 3 },
  component: inPage(RemoveDialogSection),
})
const loaderRoute = createRoute({
  getParentRoute: () => feedbackRoute,
  path: 'loader',
  staticData: { name: 'Loader', icon: 'Routing', order: 4 },
  component: inPage(LoaderSection),
})

// Group: Other.
const otherRoute = createRoute({
  getParentRoute: () => componentsRoute,
  path: 'other',
  staticData: { name: 'Other', icon: 'MoreSquare', order: 5 },
  component: () => <Outlet />,
})
const buttonRoute = createRoute({
  getParentRoute: () => otherRoute,
  path: 'button',
  staticData: { name: 'Button', icon: 'Magicpen', order: 0 },
  component: inPage(ButtonSection),
})
const iconButtonRoute = createRoute({
  getParentRoute: () => otherRoute,
  path: 'icon-button',
  staticData: { name: 'Icon Button', icon: 'Brush', order: 1 },
  component: inPage(IconButtonSection),
})
const popoverRoute = createRoute({
  getParentRoute: () => otherRoute,
  path: 'popover',
  staticData: { name: 'Popover', icon: 'Filter', order: 2 },
  component: inPage(PopoverSection),
})

// Group: Forms.
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
const fileUploaderRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'file-uploader',
  staticData: { name: 'File Uploader', icon: 'GalleryAdd', order: 14 },
  component: inPage(FileUploaderSection),
})
const toggleButtonRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'toggle-button',
  staticData: { name: 'Toggle Button', icon: 'Category2', order: 15 },
  component: inPage(ToggleButtonSection),
})
const sliderRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'slider',
  staticData: { name: 'Slider', icon: 'SliderHorizontal', order: 16 },
  component: inPage(SliderSection),
})
const formValidationsRoute = createRoute({
  getParentRoute: () => formsRoute,
  path: 'form-validations',
  staticData: { name: 'Form Validations', icon: 'Edit', order: 17 },
  component: inPage(FormValidationsSection),
})

const shellRouter = createRouter({
  routeTree: shellRoot.addChildren([
    shellIndexRoute,
    iconsRoute,
    usersRoute.addChildren([usersIndexRoute, userNewRoute, userDetailRoute, userEditRoute]),
    componentsRoute.addChildren([
      layoutsRoute.addChildren([layoutRoute, cardRoute, dividerRoute, accordionRoute]),
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
        fileUploaderRoute,
        toggleButtonRoute,
        sliderRoute,
        formValidationsRoute,
      ]),
      dataDisplayRoute.addChildren([
        typographyRoute,
        avatarRoute,
        badgeRoute,
        chipRoute,
        listRoute,
        tooltipRoute,
        emptyStateRoute,
      ]),
      navigationRoute.addChildren([tabsRoute, dropdownRoute, paginationRoute, speedDialRoute]),
      feedbackRoute.addChildren([
        alertRoute,
        toastRoute,
        modalRoute,
        removeDialogRoute,
        loaderRoute,
      ]),
      otherRoute.addChildren([buttonRoute, iconButtonRoute, popoverRoute]),
      tableGroupRoute.addChildren([
        tableLocalRoute,
        tableStripedRoute,
        tableWrapRoute,
        tableHideAllRoute,
        tableSortFieldRoute,
        tableSortSeparateRoute,
        tableSortSuffixRoute,
        tableSortOrderRoute,
        tablePagePaginationRoute,
        tableOffsetPaginationRoute,
        tableAllValueRoute,
        tableAllValueDefaultRoute,
        tableRealApiRoute,
        tableExportRoute,
        tableFiltersRoute,
        tableServerFiltersRoute,
        tableEmptyRoute,
      ]),
    ]),
  ]),
  // Open on the icon gallery so it's visible right away.
  history: createMemoryHistory({ initialEntries: ['/icons'] }),
})

export function ShellDemo() {
  return <RouterProvider router={shellRouter} />
}
