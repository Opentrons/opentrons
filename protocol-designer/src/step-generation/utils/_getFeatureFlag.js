// @flow

// HACK Ian 2019-11-12: this is a temporary solution to pass PD runtime feature flags
// down into step-generation, which is meant to be relatively independent of PD.
// WARNING: Unless you're careful to bust any caches (eg of selectors that use step-generation),
// there could be delayed-sync issues when toggling a flag with this solution, because
// we're directly accessing localStorage without an ability to monitor for changes.
// A long-term solution might be to either restart PD upon setting flags that are used here,
// or pass flags as "config options" into step-generation via a factory that stands in front of all step-generation imports,
// or just avoid this complexity for non-experimental features.
export const _getFeatureFlag = (flagName: string): boolean => {
  if (!global.localStorage) {
    let value = false
    try {
      value = process.env[flagName] === 'true'
    } catch (e) {
      console.error(
        `appear to be in node environment, but cannot access ${flagName} in process.env. ${e}`
      )
    }
    return value
  }
  const allFlags = JSON.parse(
    global.localStorage.getItem('root.featureFlags.flags') || '{}'
  )
  return (allFlags && allFlags[flagName]) || false
}
