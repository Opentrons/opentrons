// @flow
import * as React from 'react'
import { getLayersForDeck } from '@opentrons/shared-data'
import styles from './Deck.css'

const minX = -115.65
const minY = -68.03
const maxX = 624.3
const maxY = 565.2

type dValue = string
type Props = {}

const WorkingSpace = (props: Props) => {
  const layers: Array<{
    name: string,
    footprints: Array<dValue>,
  }> = getLayersForDeck()

  return (
    <svg viewBox={`${minX} ${minY} ${maxX} ${maxY}`}>
      {layers.map(layer => (
        <g id={layer.name} key={layer.name} className={styles.deck_outline}>
          {layer.footprints.map((footprint: string, index: number) => (
            <path d={footprint} key={`${layer.name}${index}`} />
          ))}
        </g>
      ))}
    </svg>
  )
}

export default WorkingSpace
