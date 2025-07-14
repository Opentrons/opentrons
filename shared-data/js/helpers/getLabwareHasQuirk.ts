import { LabwareDefinition } from '../types'

export function getLabwareHasQuirk(
  labwareDef: LabwareDefinition,
  quirk: string
): boolean {
  const quirks = labwareDef.parameters.quirks
  return quirks ? quirks.includes(quirk) : false
}
