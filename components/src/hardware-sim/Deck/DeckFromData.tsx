import * as React from 'react'
import cx from 'classnames'
import map from 'lodash/map'
import snakeCase from 'lodash/snakeCase'

import styles from './Deck.css'

import type { DeckDefinition, DeckLayer, DeckLayerFeature } from '@opentrons/shared-data'

export interface DeckFromDataProps {
  def: DeckDefinition
  layerBlocklist: string[]
}

export function DeckFromData(props: DeckFromDataProps): JSX.Element {
  const { def, layerBlocklist } = props
  return (
    <g>
      {map(def.layers, (layer: DeckLayer, layerId: string) => {
        if (layerBlocklist.includes(layerId)) return null
        return (
          <g id={layerId} key={layerId}>
            <path
              className={cx(
                styles.deck_outline,
                styles[def.otId],
                styles[snakeCase(layerId)]
              )}
              d={layer.map((l: DeckLayerFeature) => l.footprint).join(' ')}
            />
          </g>
        )
      })}
    </g>
  )
}
