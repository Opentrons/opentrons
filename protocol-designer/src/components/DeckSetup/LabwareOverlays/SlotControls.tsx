import assert from 'assert'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import noop from 'lodash/noop'
import { useDrop, DropTargetMonitor } from 'react-dnd'
import cx from 'classnames'
import { Icon, RobotCoordsForeignDiv } from '@opentrons/components'
import { DND_TYPES } from '../../../constants'
import {
  getLabwareIsCompatible,
  getLabwareIsCustom,
} from '../../../utils/labwareModuleCompatibility'
import {
  moveDeckItem,
  openAddLabwareModal,
} from '../../../labware-ingred/actions'
import { selectors as labwareDefSelectors } from '../../../labware-defs'
import { START_TERMINAL_ITEM_ID, TerminalItemId } from '../../../steplist'
import { BlockedSlot } from './BlockedSlot'

import type {
  CoordinateTuple,
  Dimensions,
  ModuleType,
} from '@opentrons/shared-data'
import type { LabwareOnDeck } from '../../../step-forms'

import styles from './LabwareOverlays.css'
interface SlotControlsProps {
  slotPosition: CoordinateTuple | null
  slotBoundingBox: Dimensions
  //  NOTE: slotId can be either AddressableAreaName or moduleId
  slotId: string
  moduleType: ModuleType | null
  selectedTerminalItemId?: TerminalItemId | null
  handleDragHover?: () => unknown
}

interface DroppedItem {
  labwareOnDeck: LabwareOnDeck
}

export const SlotControls = (props: SlotControlsProps): JSX.Element | null => {
  const {
    slotBoundingBox,
    slotPosition,
    slotId,
    selectedTerminalItemId,
    moduleType,
    handleDragHover,
  } = props
  const customLabwareDefs = useSelector(
    labwareDefSelectors.getCustomLabwareDefsByURI
  )
  const dispatch = useDispatch()
  const { t } = useTranslation('deck')

  const [{ itemType, draggedItem, isOver }, drop] = useDrop(() => ({
    accept: DND_TYPES.LABWARE,
    canDrop: (item: DroppedItem) => {
      const draggedDef = item?.labwareOnDeck?.def
      assert(draggedDef, 'no labware def of dragged item, expected it on drop')

      if (moduleType != null && draggedDef != null) {
        // this is a module slot, prevent drop if the dragged labware is not compatible
        const isCustomLabware = getLabwareIsCustom(
          customLabwareDefs,
          item.labwareOnDeck
        )

        return getLabwareIsCompatible(draggedDef, moduleType) || isCustomLabware
      }
      return true
    },
    drop: (item: DroppedItem) => {
      if (item.labwareOnDeck) {
        dispatch(moveDeckItem(item.labwareOnDeck.slot, slotId))
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

  const addLabware = (): void => {
    dispatch(openAddLabwareModal({ slot: slotId }))
  }

  return (
    <g ref={drop}>
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
            {t(`overlay.slot.${isOver ? 'place_here' : overlayText}`)}
          </a>
        </RobotCoordsForeignDiv>
      )}
    </g>
  )
}
