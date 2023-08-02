import assert from 'assert'
import * as React from 'react'
<<<<<<< HEAD
=======
import { Icon, RobotCoordsForeignDiv } from '@opentrons/components'
>>>>>>> fa1a1c2aa7 (some more stuff)
import { DropTarget, DropTargetConnector, DropTargetMonitor } from 'react-dnd'
import cx from 'classnames'
import { connect } from 'react-redux'
import noop from 'lodash/noop'
<<<<<<< HEAD
import { Icon, RobotCoordsForeignDiv } from '@opentrons/components'
import { i18n } from '../../../localization'
import { DND_TYPES } from '../../../constants'
import {
  getAdapterLabwareIsAMatch,
  getLabwareIsCustom,
} from '../../../utils/labwareModuleCompatibility'
import {
  deleteContainer,
=======
import { i18n } from '../../../localization'
import { DND_TYPES } from '../../../constants'
import { getLabwareIsCustom } from '../../../utils/labwareModuleCompatibility'
import { BlockedSlot } from './BlockedSlot'
import {
>>>>>>> fa1a1c2aa7 (some more stuff)
  moveDeckItem,
  openAddLabwareModal,
} from '../../../labware-ingred/actions'
import {
  LabwareDefByDefURI,
  selectors as labwareDefSelectors,
} from '../../../labware-defs'
import { START_TERMINAL_ITEM_ID, TerminalItemId } from '../../../steplist'
<<<<<<< HEAD
import { BlockedSlot } from './BlockedSlot'

import type { DeckSlot as DeckSlotDefinition } from '@opentrons/shared-data'
import type { BaseState, DeckSlot, ThunkDispatch } from '../../../types'
import type { LabwareOnDeck } from '../../../step-forms'

=======

import { BaseState, DeckSlot, ThunkDispatch } from '../../../types'
import { LabwareOnDeck } from '../../../step-forms'
import { DeckSlot as DeckSlotDefinition } from '@opentrons/shared-data'
>>>>>>> fa1a1c2aa7 (some more stuff)
import styles from './LabwareOverlays.css'

interface DNDP {
  isOver: boolean
  connectDropTarget: (val: React.ReactNode) => JSX.Element
<<<<<<< HEAD
  draggedItem: { labwareOnDeck: LabwareOnDeck } | null
=======
>>>>>>> fa1a1c2aa7 (some more stuff)
  itemType: string
}

interface OP {
  slot: DeckSlotDefinition & { id: DeckSlot }
<<<<<<< HEAD
  //    labwareId is the adapter's labwareId
  labwareId: string
  onDeck: boolean
  selectedTerminalItemId?: TerminalItemId | null
  handleDragHover?: () => unknown
}
interface DP {
  addLabware: (e: React.MouseEvent<any>) => unknown
  moveDeckItem: (item1: DeckSlot, item2: DeckSlot) => unknown
  deleteLabware: () => void
=======
  selectedTerminalItemId?: TerminalItemId | null
  handleDragHover?: () => unknown
  adapter: LabwareOnDeck
}

interface DP {
  addLabware: (e: React.MouseEvent<any>) => unknown
  moveDeckItem: (item1: DeckSlot, item2: DeckSlot) => unknown
>>>>>>> fa1a1c2aa7 (some more stuff)
}

interface SP {
  customLabwareDefs: LabwareDefByDefURI
}

export type SlotControlsProps = OP & DP & DNDP & SP

<<<<<<< HEAD
export const AdapterControlsComponents = (
=======
export const AdapterControlsComponent = (
>>>>>>> fa1a1c2aa7 (some more stuff)
  props: SlotControlsProps
): JSX.Element | null => {
  const {
    slot,
    addLabware,
    selectedTerminalItemId,
    isOver,
    connectDropTarget,
<<<<<<< HEAD
    draggedItem,
    itemType,
    deleteLabware,
    labwareId,
    customLabwareDefs,
    onDeck,
=======
    itemType,
    adapter,
>>>>>>> fa1a1c2aa7 (some more stuff)
  } = props
  if (
    selectedTerminalItemId !== START_TERMINAL_ITEM_ID ||
    (itemType !== DND_TYPES.LABWARE && itemType !== null)
  )
    return null

<<<<<<< HEAD
  const draggedDef = draggedItem?.labwareOnDeck?.def
  const isCustomLabware = draggedItem
    ? getLabwareIsCustom(customLabwareDefs, draggedItem.labwareOnDeck)
    : false

  let slotBlocked: string | null = null

  if (isOver && draggedDef != null && isCustomLabware) {
    slotBlocked = 'Custom Labware incompatible with this adapter'
  } else if (
    isOver &&
    draggedDef != null &&
    !getAdapterLabwareIsAMatch(labwareId, draggedDef.parameters.loadName)
  ) {
    slotBlocked = 'Labware incompatible with this adapter'
  }

=======
  let slotBlocked: string | null = null

>>>>>>> fa1a1c2aa7 (some more stuff)
  return connectDropTarget(
    <g>
      {slotBlocked ? (
        <BlockedSlot
          x={slot.position[0]}
          y={slot.position[1]}
          width={slot.boundingBox.xDimension}
          height={slot.boundingBox.yDimension}
<<<<<<< HEAD
          message="LABWARE_INCOMPATIBLE_WITH_ADAPTER"
        />
      ) : (
        <RobotCoordsForeignDiv
          x={onDeck ? slot.position[0] : 0}
          y={onDeck ? slot.position[1] : 0}
=======
          message="MODULE_INCOMPATIBLE_SINGLE_LABWARE"
        />
      ) : (
        <RobotCoordsForeignDiv
          x={slot.position[0]}
          y={slot.position[1]}
>>>>>>> fa1a1c2aa7 (some more stuff)
          width={slot.boundingBox.xDimension}
          height={slot.boundingBox.yDimension}
          innerDivProps={{
            className: cx(styles.slot_overlay, styles.appear_on_mouseover, {
              [styles.appear]: isOver,
            }),
<<<<<<< HEAD
            onClick: isOver ? noop : undefined,
=======
            onClick: isOver ? noop : addLabware,
>>>>>>> fa1a1c2aa7 (some more stuff)
          }}
        >
          <a className={styles.overlay_button} onClick={addLabware}>
            {!isOver && <Icon className={styles.overlay_icon} name="plus" />}
            {i18n.t(
              `deck.overlay.slot.${isOver ? 'place_here' : 'add_labware'}`
            )}
          </a>
<<<<<<< HEAD
          <a className={styles.overlay_button} onClick={deleteLabware}>
            {!isOver && <Icon className={styles.overlay_icon} name="close" />}
            {i18n.t('deck.overlay.edit.delete')}
          </a>
=======
>>>>>>> fa1a1c2aa7 (some more stuff)
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
<<<<<<< HEAD
  addLabware: () => dispatch(openAddLabwareModal({ slot: ownProps.labwareId })),
  moveDeckItem: (sourceSlot, destSlot) =>
    dispatch(moveDeckItem(sourceSlot, destSlot)),
  deleteLabware: () => {
    window.confirm(i18n.t('deck.warning.cancelForSure')) &&
      dispatch(deleteContainer({ labwareId: ownProps.labwareId }))
  },
=======
  addLabware: () => dispatch(openAddLabwareModal({ slot: ownProps.slot.id })),
  moveDeckItem: (sourceSlot, destSlot) =>
    dispatch(moveDeckItem(sourceSlot, destSlot)),
>>>>>>> fa1a1c2aa7 (some more stuff)
})

const slotTarget = {
  drop: (props: SlotControlsProps, monitor: DropTargetMonitor) => {
    const draggedItem = monitor.getItem()
    if (draggedItem) {
<<<<<<< HEAD
      props.moveDeckItem(draggedItem.labwareOnDeck.slot, props.labwareId)
=======
      props.moveDeckItem(draggedItem.labwareOnDeck.slot, props.slot.id)
>>>>>>> fa1a1c2aa7 (some more stuff)
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
    assert(draggedDef, 'no labware def of dragged item, expected it on drop')

    if (draggedDef != null) {
<<<<<<< HEAD
=======
      // this is a module slot, prevent drop if the dragged labware is not compatible
>>>>>>> fa1a1c2aa7 (some more stuff)
      const isCustomLabware = getLabwareIsCustom(
        props.customLabwareDefs,
        draggedItem.labwareOnDeck
      )
<<<<<<< HEAD
      return (
        getAdapterLabwareIsAMatch(
          props.labwareId,
          draggedDef.parameters.loadName
        ) || isCustomLabware
      )
=======

      return isCustomLabware
>>>>>>> fa1a1c2aa7 (some more stuff)
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

export const AdapterControls = connect(
  mapStateToProps,
  mapDispatchToProps
)(
  DropTarget(
    DND_TYPES.LABWARE,
    slotTarget,
    collectSlotTarget
<<<<<<< HEAD
  )(AdapterControlsComponents)
=======
  )(AdapterControlsComponent)
>>>>>>> fa1a1c2aa7 (some more stuff)
)
