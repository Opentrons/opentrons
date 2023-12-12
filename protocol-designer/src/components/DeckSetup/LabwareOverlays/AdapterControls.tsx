import assert from 'assert'
import * as React from 'react'
import { DropTarget, DropTargetConnector, DropTargetMonitor } from 'react-dnd'
import cx from 'classnames'
import { connect } from 'react-redux'
import noop from 'lodash/noop'
import { Icon, RobotCoordsForeignDiv } from '@opentrons/components'
import { i18n } from '../../../localization'
import { DND_TYPES } from '../../../constants'
import {
  getAdapterLabwareIsAMatch,
  getLabwareIsCustom,
} from '../../../utils/labwareModuleCompatibility'
import {
  deleteContainer,
  moveDeckItem,
  openAddLabwareModal,
} from '../../../labware-ingred/actions'
import {
  LabwareDefByDefURI,
  selectors as labwareDefSelectors,
} from '../../../labware-defs'
import { START_TERMINAL_ITEM_ID, TerminalItemId } from '../../../steplist'
import { BlockedSlot } from './BlockedSlot'

import type { CoordinateTuple, Dimensions } from '@opentrons/shared-data'
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
  slotPosition: CoordinateTuple
  slotBoundingBox: Dimensions
  //    labwareId is the adapter's labwareId
  labwareId: string
  allLabware: LabwareOnDeck[]
  onDeck: boolean
  selectedTerminalItemId?: TerminalItemId | null
  handleDragHover?: () => unknown
}
interface DP {
  addLabware: (e: React.MouseEvent<any>) => unknown
  moveDeckItem: (item1: DeckSlot, item2: DeckSlot) => unknown
  deleteLabware: () => void
}

interface SP {
  customLabwareDefs: LabwareDefByDefURI
}

export type SlotControlsProps = OP & DP & DNDP & SP

export const AdapterControlsComponents = (
  props: SlotControlsProps
): JSX.Element | null => {
  const {
    slotPosition,
    slotBoundingBox,
    addLabware,
    selectedTerminalItemId,
    isOver,
    connectDropTarget,
    draggedItem,
    itemType,
    deleteLabware,
    labwareId,
    customLabwareDefs,
    onDeck,
    allLabware,
  } = props
  if (
    selectedTerminalItemId !== START_TERMINAL_ITEM_ID ||
    (itemType !== DND_TYPES.LABWARE && itemType !== null)
  )
    return null
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
    !getAdapterLabwareIsAMatch(
      labwareId,
      allLabware,
      draggedDef.parameters.loadName
    )
  ) {
    slotBlocked = 'Labware incompatible with this adapter'
  }

  return connectDropTarget(
    <g>
      {slotBlocked ? (
        <BlockedSlot
          x={slotPosition[0]}
          y={slotPosition[1]}
          width={slotBoundingBox.xDimension}
          height={slotBoundingBox.yDimension}
          message="LABWARE_INCOMPATIBLE_WITH_ADAPTER"
        />
      ) : (
        <RobotCoordsForeignDiv
          x={onDeck ? slotPosition[0] : 0}
          y={onDeck ? slotPosition[1] : 0}
          width={slotBoundingBox.xDimension}
          height={slotBoundingBox.yDimension}
          innerDivProps={{
            className: cx(styles.slot_overlay, styles.appear_on_mouseover, {
              [styles.appear]: isOver,
            }),
            onClick: isOver ? noop : undefined,
          }}
        >
          <a className={styles.overlay_button} onClick={addLabware}>
            {!isOver && <Icon className={styles.overlay_icon} name="plus" />}
            {i18n.t(
              `deck.overlay.slot.${isOver ? 'place_here' : 'add_labware'}`
            )}
          </a>
          <a className={styles.overlay_button} onClick={deleteLabware}>
            {!isOver && <Icon className={styles.overlay_icon} name="close" />}
            {i18n.t('deck.overlay.edit.delete')}
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

const mapDispatchToProps = (dispatch: ThunkDispatch<any>, ownProps: OP): DP => {
  const adapterName =
    ownProps.allLabware.find(labware => labware.id === ownProps.labwareId)?.def
      .metadata.displayName ?? ''

  return {
    addLabware: () =>
      dispatch(openAddLabwareModal({ slot: ownProps.labwareId })),
    moveDeckItem: (sourceSlot, destSlot) =>
      dispatch(moveDeckItem(sourceSlot, destSlot)),
    deleteLabware: () => {
      window.confirm(
        i18n.t('deck.warning.cancelForSure', { adapterName: adapterName })
      ) && dispatch(deleteContainer({ labwareId: ownProps.labwareId }))
    },
  }
}

const slotTarget = {
  drop: (props: SlotControlsProps, monitor: DropTargetMonitor) => {
    const draggedItem = monitor.getItem()
    if (draggedItem) {
      props.moveDeckItem(draggedItem.labwareOnDeck.slot, props.labwareId)
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
      const isCustomLabware = getLabwareIsCustom(
        props.customLabwareDefs,
        draggedItem.labwareOnDeck
      )
      return (
        getAdapterLabwareIsAMatch(
          props.labwareId,
          props.allLabware,
          draggedDef.parameters.loadName
        ) || isCustomLabware
      )
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
  )(AdapterControlsComponents)
)
