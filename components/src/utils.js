// @flow
import { AIR, MIXED_WELL_COLOR, swatchColors } from '@opentrons/components'

export const humanizeLabwareType = (labwareType: string): string => {
  return labwareType.replace(/-|_/g, ' ')
}

export const wellNameSplit = (wellName: string): [string, string] => {
  // Eg B9 => ['B', '9']
  const raw = wellName.split(/(\D+)(\d+)/)

  if (raw.length !== 4) {
    throw Error('expected /\\D+\\d+/ regexp to split wellName, got ' + wellName)
  }

  const letters = raw[1]

  if (letters.length !== 1) {
    throw Error(
      'expected 1 letter in wellName, got ' +
        letters +
        ' in wellName: ' +
        wellName
    )
  }

  const numbers = raw[2]

  return [letters, numbers]
}

export const ingredIdsToColor = (groupIds: Array<string>): ?string => {
  const filteredIngredIds = groupIds.filter(id => id !== AIR)
  if (filteredIngredIds.length === 0) return null
  if (filteredIngredIds.length === 1)
    return swatchColors(Number(filteredIngredIds[0]))
  return MIXED_WELL_COLOR
}
