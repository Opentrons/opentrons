import { allFlags, Flags, FlagTypes } from './types'
// Overwrite feature flags that come in via query params
// Ex: https://designer.opentrons.com/?someFF=1&anotherFF=1
export const getFlagsFromQueryParams = (): Flags => {
  const urlSearchParams = new URLSearchParams(window.location.search)
  let flagsToEnable: Flags = {}

  for (const [flagName, flagValue] of urlSearchParams.entries()) {
    if (allFlags.includes(flagName as FlagTypes)) {
      flagsToEnable = { ...flagsToEnable, [flagName]: flagValue === '1' }
    }
  }

  return flagsToEnable
}
