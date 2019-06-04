// @flow
import moduleSpecs from '../module/schemas/1.json'

export type ModuleType = 'magdeck' | 'tempdeck'

// use a name like 'magdeck' to get displayName for app
export function getModuleDisplayName(name: ModuleType): string {
  const displayName = moduleSpecs[name].displayName

  return displayName
}
