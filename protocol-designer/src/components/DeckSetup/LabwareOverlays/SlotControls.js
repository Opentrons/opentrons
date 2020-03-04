// @flow
import assert from 'assert'
import React, { type Node } from 'react'
import { Icon, RobotCoordsForeignDiv } from '@opentrons/components'
import cx from 'classnames'
import { connect } from 'react-redux'
import { DropTarget } from 'react-dnd'
import noop from 'lodash/noop'
import { i18n } from '../../../localization'
import { getLabwareIsCompatible } from '../../../utils/labwareModuleCompatibility'
import { BlockedSlot } from './BlockedSlot'
import {
  openAddLabwareModal,
  moveDeckItem,
} from '../../../labware-ingred/actions'
import { START_TERMINAL_ITEM_ID, type TerminalItemId } from '../../../steplist'
import { DND_TYPES } from './constants'

import { selectors as labwareDefSelectors } from '../../../labware-defs'

import type { DeckSlot, ThunkDispatch, BaseState } from '../../../types'
import type { LabwareDefByDefURI } from '../../../labware-defs'
import type { LabwareOnDeck } from '../../../step-forms'
import type {
  DeckSlot as DeckSlotDefinition,
  ModuleRealType,
} from '@opentrons/shared-data'
import styles from './LabwareOverlays.css'

type DNDP = {|
  isOver: boolean,
  connectDropTarget: Node => mixed,
  draggedItem: ?{ labwareOnDeck: LabwareOnDeck },
|}
type OP = {|
  slot: {| ...DeckSlotDefinition, id: DeckSlot |}, // NOTE: Ian 2019-10-22 make slot `id` more restrictive when used in PD
  moduleType: ModuleRealType | null,
  selectedTerminalItemId: ?TerminalItemId,
  handleDragHover?: () => mixed,
|}
type DP = {|
  addLabware: (e: SyntheticEvent<*>) => mixed,
  moveDeckItem: (DeckSlot, DeckSlot) => mixed,
|}
type SP = {|
  customLabwares: LabwareDefByDefURI,
|}
type Props = {| ...OP, ...DP, ...DNDP, ...SP |}

const SlotControlsComponent = (props: Props) => {
  const {
    slot,
    addLabware,
    selectedTerminalItemId,
    isOver,
    connectDropTarget,
    moduleType,
    draggedItem,
    customLabwares,
  } = props
  if (selectedTerminalItemId !== START_TERMINAL_ITEM_ID) return null

  const draggedDef = draggedItem?.labwareOnDeck?.def
  const isCustomLabware =
    draggedItem && customLabwares[draggedItem.labwareOnDeck.labwareDefURI]

  let slotBlocked: string | null = null
  if (
    isOver &&
    moduleType != null &&
    draggedDef != null &&
    (!getLabwareIsCompatible(draggedDef, moduleType) && !isCustomLabware)
  ) {
    slotBlocked = 'Labware incompatible with this module'
  }

  return connectDropTarget(
    <g>
      {slotBlocked ? (
        <BlockedSlot
          x={slot.position[0]}
          y={slot.position[1]}
          width={slot.boundingBox.xDimension}
          height={slot.boundingBox.yDimension}
          message="MODULE_INCOMPATIBLE_SINGLE_LABWARE"
        />
      ) : (
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
            {i18n.t(
              `deck.overlay.slot.${isOver ? 'place_here' : 'add_labware'}`
            )}
          </a>
        </RobotCoordsForeignDiv>
      )}
    </g>
  )
}

const mapStateToProps = (state: BaseState): SP => {
  return {
    customLabwares: labwareDefSelectors.getCustomLabwareDefsByURI(state),
  }
}

const mapDispatchToProps = (dispatch: ThunkDispatch<*>, ownProps: OP): DP => ({
  addLabware: () => dispatch(openAddLabwareModal({ slot: ownProps.slot.id })),
  moveDeckItem: (sourceSlot, destSlot) =>
    dispatch(moveDeckItem(sourceSlot, destSlot)),
})

const slotTarget = {
  drop: (props, monitor) => {
    const draggedItem = monitor.getItem()
    if (draggedItem) {
      props.moveDeckItem(draggedItem.labwareOnDeck.slot, props.slot.id)
    }
  },
  hover: (props, monitor) => {
    if (props.handleDragHover) {
      props.handleDragHover()
    }
  },
  canDrop: (props, monitor) => {
    const draggedItem = monitor.getItem()
    const draggedDef = draggedItem?.labwareOnDeck?.def
    const moduleType = props.moduleType
    assert(draggedDef, 'no labware def of dragged item, expected it on drop')

    if (moduleType != null && draggedDef != null) {
      // this is a module slot, prevent drop if the dragged labware is not compatible
      const isCustomLabware =
        props.customLabwares[draggedItem.labwareOnDeck.labwareDefURI]

      return getLabwareIsCompatible(draggedDef, moduleType) || isCustomLabware
    }
    return true
  },
}
const collectSlotTarget = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  draggedItem: monitor.getItem(),
})

export const SlotControls = connect<{| ...OP, ...DP, ...SP |}, OP, _, DP, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(
  DropTarget(DND_TYPES.LABWARE, slotTarget, collectSlotTarget)(
    SlotControlsComponent
  )
)
