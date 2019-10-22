// @flow
import React, { type Node } from 'react'
import type { DeckSlot as DeckSlotDefinition } from '@opentrons/shared-data'
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
import type { DeckSlot, ThunkDispatch } from '../../../types'
import { START_TERMINAL_ITEM_ID, type TerminalItemId } from '../../../steplist'

import { DND_TYPES } from './constants'
import styles from './LabwareOverlays.css'

type DNDP = {|
  isOver: boolean,
  connectDropTarget: Node => mixed,
|}
type OP = {|
  slot: {| ...DeckSlotDefinition, id: DeckSlot |}, // NOTE: Ian 2019-10-22 make slot `id` more restrictive when used in PD
  selectedTerminalItemId: ?TerminalItemId,
|}
type DP = {|
  addLabware: (e: SyntheticEvent<*>) => mixed,
  swapSlotContents: (DeckSlot, DeckSlot) => mixed,
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
          className: cx(styles.slot_overlay, styles.appear_on_mouseover, {
            [styles.appear]: isOver,
          }),
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
      props.swapSlotContents(draggedItem.labwareOnDeck.slot, props.slot.id)
    }
  },
}
const collectSlotTarget = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
})

export default connect<{| ...OP, ...DP |}, OP, _, DP, _, _>(
  null,
  mapDispatchToProps
)(DropTarget(DND_TYPES.LABWARE, slotTarget, collectSlotTarget)(SlotControls))
