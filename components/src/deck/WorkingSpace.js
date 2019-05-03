// @flow
import * as React from 'react'
import {
  getDeckLayers,
  type DeckDefinition,
  type DeckSlot,
} from '@opentrons/shared-data'
import { getDeckDefinitions } from '../utils'
import styles from './Deck.css'

type dValue = string
type Props = {
  deckName: string,
  children: DeckSlot => React.Node,
}

class WorkingSpace extends React.Component<Props> {
  deckDef: DeckDefinition
  static defaultProps = { deckName: 'ot2_standard' }

  constructor(props: Props) {
    super(props)
    const allDecks = getDeckDefinitions()
    this.deckDef = allDecks[this.props.deckName]
  }

  render() {
    if (!this.deckDef) return null
    const { deckName } = this.props

    const [viewBoxOriginX, viewBoxOriginY] = this.deckDef.cornerOffsetFromOrigin
    const [deckXDimension, deckYDimension] = this.deckDef.dimensions

    const slots = this.deckDef.locations.orderedSlots.reduce(
      (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
      {}
    )
    return (
      <svg
        className={styles.working_space}
        viewBox={`${viewBoxOriginX} ${viewBoxOriginY} ${deckXDimension} ${deckYDimension}`}
      >
        <Deck deckName={deckName} />
        {this.props.children({ slots })}
      </svg>
    )
  }
}

type DeckProps = { deckName: string }
class Deck extends React.PureComponent<DeckProps> {
  render() {
    const layers: Array<{
      name: string,
      footprints: Array<dValue>,
    }> = getDeckLayers(this.props.deckName)

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

// NOTE: In order for arbitrary UI text and foreigObjects
// to render properly in the robot coordinate system, use these
// components which will perform the necessary transformation
type TextProps = any // $FlowFixMe(bc, 2019-05-03) React.ElementProps<'text'>
export const Text = (props: TextProps) => (
  <text {...props} y={-props.y} style={{ transform: 'scale(1, -1)' }}>
    {props.children}
  </text>
)

type ForeignObjectProps = any // $FlowFixMe(bc, 2019-05-03) React.ElementProps<'foreignObject'>
export const ForeignObject = (props: ForeignObjectProps) => (
  <foreignObject {...props}>
    <div
      style={{ transform: 'scale(1, -1)' }}
      xmlns="http://www.w3.org/1999/xhtml"
    >
      {props.children}
    </div>
  </foreignObject>
)

export default WorkingSpace
