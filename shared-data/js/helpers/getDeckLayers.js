// @flow

import map from 'lodash/map'
import assert from 'assert'
import definitions from '../../build/decks.json'

const getDeckLayers = (deckLoadName: string) => {
  const deckDef = definitions[deckLoadName]

  assert(deckDef && deckDef.layers, 'Deck must exist and contain layers')

  return map(deckDef.layers, (layer, name) => ({
    name,
    footprints: layer.map(layer => layer.footprint),
  }))
}

export default getDeckLayers
