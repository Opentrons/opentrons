// @flow
import startCase from 'lodash/startCase'
import {
  swatchColors,
  MIXED_WELL_COLOR,
} from '@opentrons/components'

export const humanizeLabwareType = startCase

export const wellNameSplit = (wellName: string): [string, string] => {
  // Eg B9 => ['B', '9']
  const raw = wellName.split(/(\D+)(\d+)/)

  if (raw.length !== 4) {
    throw Error('expected /\\D+\\d+/ regexp to split wellName, got ' + wellName)
  }

  const letters = raw[1]

  if (letters.length !== 1) {
    throw Error('expected 1 letter in wellName, got ' + letters + ' in wellName: ' + wellName)
  }

  const numbers = raw[2]

  return [letters, numbers]
}

// TODO Ian 2018-07-20: make sure '__air__' or other pseudo-ingredients don't get in here
export const ingredIdsToColor = (groupIds: Array<string>): ?string => {
  if (groupIds.length === 0) return null
  if (groupIds.length === 1) return swatchColors(Number(groupIds[0]))
  return MIXED_WELL_COLOR
}
