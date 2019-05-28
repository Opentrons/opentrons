// @flow
import React from 'react'
import type { DeckSlot } from '@opentrons/shared-data'
import { Icon, RobotCoordsForeignDiv } from '@opentrons/components'
import cx from 'classnames'
import { connect } from 'react-redux'
import { DropTarget } from 'react-dnd'
import { openAddLabwareModal } from '../../../labware-ingred/actions'
import i18n from '../../../localization'
import type { ThunkDispatch } from '../../../types'
import { START_TERMINAL_ITEM_ID, type TerminalItemId } from '../../../steplist'

import { DND_TYPES } from '../../labware/LabwareOnDeck/constants'
import { EmptyDestinationSlot } from './EmptyDestinationSlot'
import styles from './LabwareOverlays.css'

type OP = {|
  slot: DeckSlot,
  selectedTerminalItemId: ?TerminalItemId,
|}
type DP = {|
  addLabware: (e: SyntheticEvent<*>) => mixed,
|}
type Props = {| ...OP, ...DP |}

const SlotControls = ({
  slot,
  addLabware,
  selectedTerminalItemId,
  ...restProps
}: Props) => {
  if (selectedTerminalItemId !== START_TERMINAL_ITEM_ID) return null
  // if (restProps.isOver) {
  console.log('rest props', restProps)
  const { isOver } = restProps
  return restProps.connectDropTarget(
    <g>
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
          {isOver
            ? i18n.t('deck.overlay.slot.place_here')
            : i18n.t('deck.overlay.slot.add_labware')}
        </a>
      </RobotCoordsForeignDiv>
    </g>
  )
}

const mapDispatchToProps = (dispatch: ThunkDispatch<*>, ownProps: OP): DP => ({
  addLabware: () => dispatch(openAddLabwareModal({ slot: ownProps.slot.id })),
})

const labwareTarget = {
  canDrop: (props, monitor) => {
    const draggedItem = monitor.getItem()
    return draggedItem && draggedItem.slot !== props.slot.id
  },
  drop: (props, monitor) => {
    const draggedItem = monitor.getItem()
    if (draggedItem) {
      props.swapSlotContents(draggedItem.slot, props.slot.id)
    }
  },
}
const collectLabwareTarget = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
})

export default DropTarget(
  DND_TYPES.LABWARE,
  labwareTarget,
  collectLabwareTarget
)(
  connect<Props, OP, _, DP, _, _>(
    null,
    mapDispatchToProps
  )(SlotControls)
)
