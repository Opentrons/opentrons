// @flow
import React from 'react'
import type { DeckSlot } from '@opentrons/shared-data'
import { RobotCoordsForeignDiv } from '@opentrons/components'
import cx from 'classnames'
import { connect } from 'react-redux'
import { openAddLabwareModal } from '../../labware-ingred/actions'
import i18n from '../../localization'
import styles from './DeckSetup.css'

type OP = {| slot: DeckSlot |}
type DP = {|
  addLabware: (e: SyntheticEvent<*>) => mixed,
|}
type Props = {| ...OP, ...DP |}

const AddLabwareOverlay = ({ slot, addLabware }: Props) => (
  <RobotCoordsForeignDiv
    x={slot.position[0]}
    y={slot.position[1]}
    width={slot.boundingBox.xDimension}
    height={slot.boundingBox.yDimension}
    innerDivProps={{
      className: cx(styles.slot_overlay, styles.appear_on_mouseover),
      onClick: addLabware,
    }}
  >
    <p>+ Add Labware</p>
  </RobotCoordsForeignDiv>
)

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OP): DP => ({
  addLabware: () => dispatch(openAddLabwareModal({ slot: ownProps.slot.id })),
})

export default connect<Props, OP, _, DP, _, _>(
  null,
  mapDispatchToProps
)(AddLabwareOverlay)
