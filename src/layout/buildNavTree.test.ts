import { describe, expect, it } from 'vitest'
import { buildNavTree, firstNavTo, type NavRoute } from './Sidebar'

// A synthetic route list mimicking file-based routes (fullPath + staticData).
const routes: NavRoute[] = [
  { fullPath: '/dashboard/', staticData: { name: 'Dashboard', icon: 'Category', order: 0 } },
  { fullPath: '/components', staticData: { name: 'Components', icon: 'Box', order: 1 } }, // module chrome
  { fullPath: '/components/theme-toggle/', staticData: { name: 'Theme Toggle', order: 1 } }, // level-2 direct link
  { fullPath: '/components/forms', staticData: { name: 'Forms', icon: 'DocumentText', order: 0 } }, // group chrome
  { fullPath: '/components/forms/', staticData: undefined }, // group's own index page → Case B trigger
  { fullPath: '/components/forms/button/', staticData: { name: 'Button', order: 1 } },
  { fullPath: '/components/forms/input/', staticData: { name: 'Input', order: 0 } },
  { fullPath: '/components/hidden-page/', staticData: { name: 'Hidden', hidden: true } },
  { fullPath: '/', staticData: undefined }, // root → no name → excluded
]

describe('buildNavTree', () => {
  const tree = buildNavTree(routes)

  it('puts a 1-segment named route in the top links', () => {
    expect(tree.links).toEqual([{ label: 'Dashboard', to: '/dashboard', icon: 'Category' }])
  })

  it('builds a module from path segments, with chrome from its route', () => {
    expect(tree.modules).toHaveLength(1)
    expect(tree.modules[0].module).toBe('Components')
    expect(tree.modules[0].icon).toBe('Box')
  })

  it('renders a 2-segment route with no children as a clickable group row', () => {
    const themeToggle = tree.modules[0].groups.find((g) => g.label === 'Theme Toggle')
    expect(themeToggle).toMatchObject({ to: '/components/theme-toggle', children: undefined })
  })

  it('builds module → group → page, sorted by order', () => {
    const forms = tree.modules[0].groups.find((g) => g.label === 'Forms')
    expect(forms?.icon).toBe('DocumentText')
    expect(forms?.children?.map((c) => c.label)).toEqual(['Input', 'Button']) // order 0, then 1
  })

  it('marks a group as its own page (Case B) when an index route exists at the group path', () => {
    const forms = tree.modules[0].groups.find((g) => g.label === 'Forms')
    expect(forms?.to).toBe('/components/forms') // navigable AND has children
    expect(forms?.children?.length).toBe(2)
  })

  it('sorts groups by order (Forms 0 before Theme Toggle 1)', () => {
    expect(tree.modules[0].groups.map((g) => g.label)).toEqual(['Forms', 'Theme Toggle'])
  })

  it('excludes hidden routes and nameless routes from the menu', () => {
    const labels = tree.modules.flatMap((m) => [
      ...m.groups.map((g) => g.label),
      ...m.groups.flatMap((g) => g.children ?? []).map((c) => c.label),
    ])
    expect(labels).not.toContain('Hidden')
  })

  it('auto-prettifies a missing module/group label from the segment', () => {
    const tree2 = buildNavTree([
      // no chrome route for "settings"; only a child names itself
      { fullPath: '/settings/profile/', staticData: { name: 'Profile' } },
    ])
    expect(tree2.modules[0].module).toBe('Settings') // prettified from "settings"
  })
})

describe('firstNavTo', () => {
  it('returns the first top link when present', () => {
    expect(firstNavTo(buildNavTree(routes))).toBe('/dashboard')
  })

  it('falls back to the first group/leaf when there are no top links', () => {
    const tree = buildNavTree([
      { fullPath: '/components', staticData: { name: 'Components' } },
      { fullPath: '/components/forms', staticData: { name: 'Forms' } },
      { fullPath: '/components/forms/button/', staticData: { name: 'Button' } },
    ])
    expect(firstNavTo(tree)).toBe('/components/forms/button')
  })

  it('returns undefined for an empty menu', () => {
    expect(firstNavTo(buildNavTree([{ fullPath: '/', staticData: undefined }]))).toBeUndefined()
  })
})
