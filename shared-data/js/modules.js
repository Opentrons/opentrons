// @flow
import type { ModuleType } from './types'
import moduleSpecs from '../module/definitions/2.json'

// use a name like 'magdeck' to get displayName for app
export function getModuleDisplayName(name: ModuleType): string {
  const displayName = moduleSpecs[name].displayName

  return displayName
}
