// @flow
import React from 'react'
import type { DeckSlot } from '@opentrons/shared-data'
import { Icon, RobotCoordsForeignDiv } from '@opentrons/components'
import cx from 'classnames'
import { connect } from 'react-redux'
import { openAddLabwareModal } from '../../../labware-ingred/actions'
import i18n from '../../../localization'
import type { ThunkDispatch } from '../../../types'
import { START_TERMINAL_ITEM_ID, type TerminalItemId } from '../../../steplist'
import styles from './LabwareOverlays.css'

type OP = {|
  slot: DeckSlot,
  selectedTerminalItemId: ?TerminalItemId,
|}
type DP = {|
  addLabware: (e: SyntheticEvent<*>) => mixed,
|}
type Props = {| ...OP, ...DP |}

const SlotControls = ({ slot, addLabware, selectedTerminalItemId }: Props) => {
  if (selectedTerminalItemId !== START_TERMINAL_ITEM_ID) return null
  return (
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
      <a className={styles.overlay_button} onClick={addLabware}>
        <Icon className={styles.overlay_icon} name="plus" />
        Add Labware
      </a>
    </RobotCoordsForeignDiv>
  )
}

const mapDispatchToProps = (dispatch: ThunkDispatch<*>, ownProps: OP): DP => ({
  addLabware: () => dispatch(openAddLabwareModal({ slot: ownProps.slot.id })),
})

export default connect<Props, OP, _, DP, _, _>(
  null,
  mapDispatchToProps
)(SlotControls)
