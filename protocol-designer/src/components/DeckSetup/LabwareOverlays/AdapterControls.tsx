import assert from 'assert'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DropTargetMonitor, useDrop } from 'react-dnd'
import cx from 'classnames'
import noop from 'lodash/noop'
import { Icon, RobotCoordsForeignDiv } from '@opentrons/components'
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
import { selectors as labwareDefSelectors } from '../../../labware-defs'
import { START_TERMINAL_ITEM_ID, TerminalItemId } from '../../../steplist'
import { BlockedSlot } from './BlockedSlot'

import type { CoordinateTuple, Dimensions } from '@opentrons/shared-data'
import type { LabwareOnDeck } from '../../../step-forms'

import styles from './LabwareOverlays.css'

interface AdapterControlsProps {
  slotPosition: CoordinateTuple
  slotBoundingBox: Dimensions
  //    labwareId is the adapter's labwareId
  labwareId: string
  allLabware: LabwareOnDeck[]
  onDeck: boolean
  selectedTerminalItemId?: TerminalItemId | null
  handleDragHover?: () => void
}

interface DroppedItem {
  labwareOnDeck: LabwareOnDeck
}

export const AdapterControls = (
  props: AdapterControlsProps
): JSX.Element | null => {
  const {
    slotPosition,
    slotBoundingBox,
    selectedTerminalItemId,
    labwareId,
    onDeck,
    handleDragHover,
    allLabware,
  } = props
  const customLabwareDefs = useSelector(
    labwareDefSelectors.getCustomLabwareDefsByURI
  )

  const dispatch = useDispatch()
  const adapterName =
    allLabware.find(labware => labware.id === labwareId)?.def.metadata
      .displayName ?? ''

  const [{ itemType, draggedItem, isOver }, drop] = useDrop(() => ({
    accept: DND_TYPES.LABWARE,
    canDrop: (item: DroppedItem) => {
      const draggedDef = item.labwareOnDeck?.def
      assert(draggedDef, 'no labware def of dragged item, expected it on drop')

      if (draggedDef != null) {
        const isCustomLabware = getLabwareIsCustom(
          customLabwareDefs,
          item.labwareOnDeck
        )
        return (
          getAdapterLabwareIsAMatch(
            labwareId,
            allLabware,
            draggedDef.parameters.loadName
          ) || isCustomLabware
        )
      }
      return true
    },
    drop: (item: DroppedItem) => {
      if (item.labwareOnDeck) {
        dispatch(moveDeckItem(item.labwareOnDeck.slot, labwareId))
      }
    },
    hover: () => {
      if (handleDragHover) {
        handleDragHover()
      }
    },
    collect: (monitor: DropTargetMonitor) => ({
      itemType: monitor.getItemType(),
      isOver: !!monitor.isOver(),
      draggedItem: monitor.getItem() as DroppedItem,
    }),
  }))

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

  return (
    <g ref={drop}>
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
          <a
            className={styles.overlay_button}
            onClick={() => dispatch(openAddLabwareModal({ slot: labwareId }))}
          >
            {!isOver && <Icon className={styles.overlay_icon} name="plus" />}
            {isOver ? 'Place Here' : 'Add Labware'}
          </a>
          <a
            className={styles.overlay_button}
            onClick={() => {
              window.confirm(
                `"Are you sure you want to remove this ${adapterName}?`
              ) && dispatch(deleteContainer({ labwareId: labwareId }))
            }}
          >
            {!isOver && <Icon className={styles.overlay_icon} name="close" />}
            {'Delete'}
          </a>
        </RobotCoordsForeignDiv>
      )}
    </g>
  )
}
