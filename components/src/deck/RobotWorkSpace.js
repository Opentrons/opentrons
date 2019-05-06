// @flow
import * as React from 'react'
import { type DeckDefinition, type DeckSlot } from '@opentrons/shared-data'
import { getDeckDefinitions } from './getDeckDefinitions'
import { DeckFromData } from './Deck'
import styles from './RobotWorkSpace.css'

type RenderProps = {
  slots: { [string]: DeckSlot },
}
type Props = {
  deckName: string,
  viewBox: string,
  children?: RenderProps => React.Node,
  deckLayerBlacklist: Array<string>,
}

// NOTE: this component assumes, for performance reasons,
// that the deckName prop is not dynamic for a mounted component
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
    if (!this.deckDef && !this.props.viewBox) return null
    const { deckLayerBlacklist, viewBox } = this.props

    let wholeDeckViewBox = null
    let slots = {}
    if (this.deckDef) {
      const [
        viewBoxOriginX,
        viewBoxOriginY,
      ] = this.deckDef.cornerOffsetFromOrigin
      const [deckXDimension, deckYDimension] = this.deckDef.dimensions

      slots = this.deckDef.locations.orderedSlots.reduce(
        (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
        {}
      )
      wholeDeckViewBox = `${viewBoxOriginX} ${viewBoxOriginY} ${deckXDimension} ${deckYDimension}`
    }

    return (
      <svg
        className={styles.robot_work_space}
        viewBox={viewBox || wholeDeckViewBox}
      >
        {this.deckDef && (
          <DeckFromData
            def={this.deckDef}
            layerBlacklist={deckLayerBlacklist}
          />
        )}
        {this.props.children && this.props.children({ slots })}
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
