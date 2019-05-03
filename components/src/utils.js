// @flow
import { swatchColors, MIXED_WELL_COLOR, AIR } from '@opentrons/components'
import type { DeckDefinition } from '@opentrons/shared-data'

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

// TODO: Brian 2019-05-01 very similar to getAllDefinitions in labware-library,
// and PD labware-def utils should reconcile differences & make a general util
// fn imported from shared-data, but this relies on a webpack-specific method,
// and SD is not webpacked

// require all definitions in the definitions2 directory
// $FlowFixMe: require.context is webpack-specific method
const deckDefinitionsContext = require.context(
  '@opentrons/shared-data/robot-data/decks',
  true, // traverse subdirectories
  /\.json$/, // import filter
  'sync' // load every definition into one synchronous chunk
)

export function getDeckDefinitions(): { [string]: DeckDefinition } {
  const deckDefinitions = deckDefinitionsContext
    .keys()
    .reduce((acc, filename) => {
      const def = deckDefinitionsContext(filename)
      return { ...acc, [def.otId]: def }
    }, {})

  return deckDefinitions
}
