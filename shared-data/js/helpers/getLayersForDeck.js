// @flow
import ot2Standard from '../../robot-data/decks/ot2Standard.json'
import map from 'lodash/map'

const getLayersForDeck = () => {
  return map(
    ot2Standard.layers,
    (layer, name) => ({
      name,
      footprints: layer.map(layer => layer.footprint),
    })
  )
}

export default getLayersForDeck
