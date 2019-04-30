// @flow
import * as React from 'react'
import { getDeckLayers, type DeckDimensions } from '@opentrons/shared-data'
import styles from './Deck.css'

// TODO: IMMEDIATELY put in deck definition, and get from there
const originX = -115.65
const originY = -68.03
const xDimension = 624.3
const yDimension = 565.2

type dValue = string
type Props = { deckLoadName: string }

const WorkingSpace = (props: Props) => {
  const {deckLoadName = 'ot2_standard'} = props

  const {
    xCornerOffsetFromOrigin,
    yCornerOffsetFromOrigin,
    boundingBoxXDimension,
    boundingBoxYDimension,
  }: DeckDimensions = getDeckDimensions(deckLoadName)

  return (
    <svg className={styles.working_space} viewBox={`${originX} ${originY} ${xDimension} ${yDimension}`}>
      <Deck deckLoadName={deckLoadName} />

      <text
        x={240}
        y={-160}
        onClick={(e) => console.log(e.target.x)}
        style={{ transform: 'scale(1, -1)' }}>
        HEY HELLO THERE
      </text>
      <foreignObject x={128} y={80} height='20px' width='100px'>
        <div
          style={{ transform: 'scale(1, -1)' }}
          xmlns="http://www.w3.org/1999/xhtml">
          <input placeholder='Name Here'></input>
        </div>
      </foreignObject>
    </svg>
  )

}

type DeckProps = {deckLoadName: string}
class Deck extends React.PureComponent<DeckProps> {
  render() {
    const layers: Array<{
      name: string,
      footprints: Array<dValue>,
    }> = getDeckLayers(this.props.deckLoadName)

    return (
      <g>
        {layers.map(layer => (
          <g id={layer.name} key={layer.name} className={styles.deck_outline}>
            {layer.footprints.map((footprint: string, index: number) => (
              <path d={footprint} key={`${layer.name}${index}`} />
            ))}
          </g>
        ))}
      </g>
    )
  }
}

export default WorkingSpace
