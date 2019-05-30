// @flow
import React from 'react'
import type { DeckSlot } from '@opentrons/shared-data'
import { Icon, RobotCoordsForeignDiv } from '@opentrons/components'
import cx from 'classnames'
import { connect } from 'react-redux'
import { DropTarget } from 'react-dnd'
import noop from 'lodash/noop'
import {
  openAddLabwareModal,
  swapSlotContents,
} from '../../../labware-ingred/actions'
import i18n from '../../../localization'
import type { ThunkDispatch } from '../../../types'
import { START_TERMINAL_ITEM_ID, type TerminalItemId } from '../../../steplist'

import { DND_TYPES } from './constants'
import styles from './LabwareOverlays.css'

type DNDP = {|
  isOver: boolean,
  connectDropTarget: React.Node => mixed,
|}
type OP = {|
  slot: DeckSlot,
  selectedTerminalItemId: ?TerminalItemId,
|}
type DP = {|
  addLabware: (e: SyntheticEvent<*>) => mixed,
  swapSlotContents: (DeckSlotId, DeckSlotId) => void,
|}
type Props = {| ...OP, ...DP, ...DNDP |}

const SlotControls = ({
  slot,
  addLabware,
  selectedTerminalItemId,
  isOver,
  connectDropTarget,
}: Props) => {
  if (selectedTerminalItemId !== START_TERMINAL_ITEM_ID) return null
  return connectDropTarget(
    <g>
      <RobotCoordsForeignDiv
        x={slot.position[0]}
        y={slot.position[1]}
        width={slot.boundingBox.xDimension}
        height={slot.boundingBox.yDimension}
        innerDivProps={{
          className: cx(styles.slot_overlay, styles.appear_on_mouseover),
          onClick: isOver ? noop : addLabware,
        }}
      >
        <a className={styles.overlay_button} onClick={addLabware}>
          {!isOver && <Icon className={styles.overlay_icon} name="plus" />}
          {i18n.t(`deck.overlay.slot.${isOver ? 'place_here' : 'add_labware'}`)}
        </a>
      </RobotCoordsForeignDiv>
    </g>
  )
}

const mapDispatchToProps = (dispatch: ThunkDispatch<*>, ownProps: OP): DP => ({
  addLabware: () => dispatch(openAddLabwareModal({ slot: ownProps.slot.id })),
  swapSlotContents: (sourceSlot, destSlot) =>
    dispatch(swapSlotContents(sourceSlot, destSlot)),
})

const slotTarget = {
  drop: (props, monitor) => {
    const draggedItem = monitor.getItem()
    if (draggedItem) {
      props.swapSlotContents(draggedItem.slot, props.slot.id)
    }
  },
}
const collectSlotTarget = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
})

export default connect<Props, OP, _, DP, _, _>(
  null,
  mapDispatchToProps
)(DropTarget(DND_TYPES.LABWARE, slotTarget, collectSlotTarget)(SlotControls))
