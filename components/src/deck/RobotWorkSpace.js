// @flow
import * as React from 'react'
import { type DeckDefinition, type DeckSlot } from '@opentrons/shared-data'
import { getDeckDefinitions } from '../utils'
import { DeckFromData } from './Deck'
import styles from './RobotWorkSpace.css'

type Props = {
  deckName: string,
  children: DeckSlot => React.Node,
  deckLayerBlacklist: Array<string>,
}

class RobotWorkSpace extends React.Component<Props> {
  deckDef: DeckDefinition
  static defaultProps = {
    deckName: 'ot2_standard',
    deckLayerBlacklist: [],
  }

  constructor(props: Props) {
    super(props)
    const allDecks = getDeckDefinitions()
    this.deckDef = allDecks[this.props.deckName]
  }

  render() {
    if (!this.deckDef) return null
    const { deckLayerBlacklist } = this.props

    const [viewBoxOriginX, viewBoxOriginY] = this.deckDef.cornerOffsetFromOrigin
    const [deckXDimension, deckYDimension] = this.deckDef.dimensions

    const slots = this.deckDef.locations.orderedSlots.reduce(
      (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
      {}
    )

    const visibleDeckLayers: Array<string> = Object.keys(
      this.deckDef.layers
    ).filter(l => !deckLayerBlacklist.includes(l))

    return (
      <svg
        className={styles.working_space}
        viewBox={`${viewBoxOriginX} ${viewBoxOriginY} ${deckXDimension} ${deckYDimension}`}
      >
        <DeckFromData def={this.deckDef} visibleLayers={visibleDeckLayers} />
        {this.props.children({ slots })}
      </svg>
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

export default RobotWorkSpace
