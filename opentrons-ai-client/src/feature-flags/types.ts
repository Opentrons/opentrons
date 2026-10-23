// When flag types are removed from this list, the browser will hold on to that value indefinitely.
// To avoid being surprised when/if we deprecate and then re-introduce a flag with the same type string,
// items should never be removed from this list.
// Deprecated types should never be reused (unless there's a really good reason).
export const DEPRECATED_FLAGS = [
  // Feature flags modal removed - settings page now handles all feature flags
  'displayFeatureFlagsModal',
  // PD protocol generation removed (AUTH-2850) - PD format is no longer supported
  'enablePDProtocolGeneration',
]

// union of feature flag string constant IDs
export type FlagTypes = 'enablePrereleaseMode' | 'enableAnalytics'

// flags that are not in this list only show in prerelease mode
export const userFacingFlags: FlagTypes[] = ['enableAnalytics']

export const allFlags: FlagTypes[] = [
  ...userFacingFlags,
  'enablePrereleaseMode',
]

export type Flags = Partial<Record<FlagTypes, boolean | null | undefined>>
