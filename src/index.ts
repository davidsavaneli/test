// Root entry — aggregates every subpath into one import. Prefer the scoped imports
// (`sava-test/components`, `sava-test/hooks`, …); this stays for convenience and for toolchains
// without subpath (`exports`) resolution.
export * from './entries/components'
export * from './entries/hooks'
export * from './entries/theme'
export * from './entries/helpers'
// `Icon`, `IconName`, `ICON_NAMES` already come through `./entries/components`; add the raw registry.
export { icons } from './icons/icons'
