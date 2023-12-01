import assert from 'assert'
import * as React from 'react'
import { connect } from 'react-redux'
import noop from 'lodash/noop'
import { DropTarget, DropTargetConnector, DropTargetMonitor } from 'react-dnd'
import cx from 'classnames'
import { Icon, RobotCoordsForeignDiv } from '@opentrons/components'
import { i18n } from '../../../localization'
import { DND_TYPES } from '../../../constants'
import {
  getLabwareIsCompatible,
  getLabwareIsCustom,
} from '../../../utils/labwareModuleCompatibility'
import {
  moveDeckItem,
  openAddLabwareModal,
} from '../../../labware-ingred/actions'
import {
  LabwareDefByDefURI,
  selectors as labwareDefSelectors,
} from '../../../labware-defs'
import { START_TERMINAL_ITEM_ID, TerminalItemId } from '../../../steplist'
import { BlockedSlot } from './BlockedSlot'

import type {
  CoordinateTuple,
  Dimensions,
  ModuleType,
} from '@opentrons/shared-data'
import type { BaseState, DeckSlot, ThunkDispatch } from '../../../types'
import type { LabwareOnDeck } from '../../../step-forms'
import styles from './LabwareOverlays.css'

interface DNDP {
  isOver: boolean
  connectDropTarget: (val: React.ReactNode) => JSX.Element
  draggedItem: { labwareOnDeck: LabwareOnDeck } | null
  itemType: string
}

interface OP {
  slotPosition: CoordinateTuple | null
  slotBoundingBox: Dimensions
  //  NOTE: slotId can be either AddressableAreaName or moduleId
  slotId: string
  moduleType: ModuleType | null
  selectedTerminalItemId?: TerminalItemId | null
  handleDragHover?: () => unknown
}

interface DP {
  addLabware: (e: React.MouseEvent<any>) => unknown
  moveDeckItem: (item1: DeckSlot, item2: DeckSlot) => unknown
}

interface SP {
  customLabwareDefs: LabwareDefByDefURI
}

export type SlotControlsProps = OP & DP & DNDP & SP

export const SlotControlsComponent = (
  props: SlotControlsProps
): JSX.Element | null => {
  const {
    slotBoundingBox,
    slotPosition,
    addLabware,
    selectedTerminalItemId,
    isOver,
    connectDropTarget,
    moduleType,
    draggedItem,
    itemType,
    customLabwareDefs,
  } = props
  if (
    selectedTerminalItemId !== START_TERMINAL_ITEM_ID ||
    (itemType !== DND_TYPES.LABWARE && itemType !== null) ||
    slotPosition == null
  )
    return null

  const draggedDef = draggedItem?.labwareOnDeck?.def
  const isCustomLabware = draggedItem
    ? getLabwareIsCustom(customLabwareDefs, draggedItem.labwareOnDeck)
    : false

  let slotBlocked: string | null = null
  if (
    isOver &&
    moduleType != null &&
    draggedDef != null &&
    !getLabwareIsCompatible(draggedDef, moduleType) &&
    !isCustomLabware
  ) {
    slotBlocked = 'Labware incompatible with this module'
  }

  const isOnHeaterShaker = moduleType === 'heaterShakerModuleType'
  const isNoAdapterOption =
    moduleType === 'magneticBlockType' ||
    moduleType === 'magneticModuleType' ||
    moduleType === 'thermocyclerModuleType'
  let overlayText: string = 'add_adapter_or_labware'
  if (isOnHeaterShaker) {
    overlayText = 'add_adapter'
  } else if (isNoAdapterOption) {
    overlayText = 'add_labware'
  }

  return connectDropTarget(
    <g>
      {slotBlocked ? (
        <BlockedSlot
          x={slotPosition[0]}
          y={slotPosition[1]}
          width={slotBoundingBox.xDimension}
          height={slotBoundingBox.yDimension}
          message="MODULE_INCOMPATIBLE_SINGLE_LABWARE"
        />
      ) : (
        <RobotCoordsForeignDiv
          x={slotPosition[0]}
          y={slotPosition[1]}
          width={slotBoundingBox.xDimension}
          height={slotBoundingBox.yDimension}
          innerDivProps={{
            className: cx(styles.slot_overlay, styles.appear_on_mouseover, {
              [styles.appear]: isOver,
            }),
            onClick: isOver ? noop : addLabware,
          }}
        >
          <a className={styles.overlay_button} onClick={addLabware}>
            {!isOver && <Icon className={styles.overlay_icon} name="plus" />}
            {i18n.t(`deck.overlay.slot.${isOver ? 'place_here' : overlayText}`)}
          </a>
        </RobotCoordsForeignDiv>
      )}
    </g>
  )
}

const mapStateToProps = (state: BaseState): SP => {
  return {
    customLabwareDefs: labwareDefSelectors.getCustomLabwareDefsByURI(state),
  }
}

const mapDispatchToProps = (
  dispatch: ThunkDispatch<any>,
  ownProps: OP
): DP => ({
  addLabware: () => dispatch(openAddLabwareModal({ slot: ownProps.slotId })),
  moveDeckItem: (sourceSlot, destSlot) =>
    dispatch(moveDeckItem(sourceSlot, destSlot)),
})

const slotTarget = {
  drop: (props: SlotControlsProps, monitor: DropTargetMonitor) => {
    const draggedItem = monitor.getItem()
    if (draggedItem) {
      props.moveDeckItem(draggedItem.labwareOnDeck.slot, props.slotId)
    }
  },
  hover: (props: SlotControlsProps) => {
    if (props.handleDragHover) {
      props.handleDragHover()
    }
  },
  canDrop: (props: SlotControlsProps, monitor: DropTargetMonitor) => {
    const draggedItem = monitor.getItem()
    const draggedDef = draggedItem?.labwareOnDeck?.def
    const moduleType = props.moduleType
    assert(draggedDef, 'no labware def of dragged item, expected it on drop')

    if (moduleType != null && draggedDef != null) {
      // this is a module slot, prevent drop if the dragged labware is not compatible
      const isCustomLabware = getLabwareIsCustom(
        props.customLabwareDefs,
        draggedItem.labwareOnDeck
      )

      return getLabwareIsCompatible(draggedDef, moduleType) || isCustomLabware
    }
    return true
  },
}
const collectSlotTarget = (
  connect: DropTargetConnector,
  monitor: DropTargetMonitor
): React.ReactNode => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  draggedItem: monitor.getItem(),
  itemType: monitor.getItemType(),
})

export const SlotControls = connect(
  mapStateToProps,
  mapDispatchToProps
)(
  DropTarget(
    DND_TYPES.LABWARE,
    slotTarget,
    collectSlotTarget
  )(SlotControlsComponent)
)
