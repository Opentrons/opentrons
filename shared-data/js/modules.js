// @flow
import moduleSpecs from '../robot-data/moduleSpecs.json'

// use a name like 'magdeck' to get displayName for app
export function getModuleDisplayName (name: string): ?string {
  const displayName = moduleSpecs[name].displayName

  return displayName
}
