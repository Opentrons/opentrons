import { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  COLORS,
  CURSOR_POINTER,
  Flex,
  JUSTIFY_CENTER,
  Link,
  RobotCoordsForeignDiv,
  StyledText,
} from '@opentrons/components'
import {
  FLEX_STACKER_MODULE_TYPE,
  getCutoutIdFromAddressableArea,
} from '@opentrons/shared-data'
import {
  getIsSlotAHopper,
  getIsSlotAVacuumDock,
} from '@opentrons/step-generation'

import { DND_TYPES } from '/protocol-designer/constants'
import { selectors as labwareDefSelectors } from '/protocol-designer/labware-defs'
import { moveDeckItem } from '/protocol-designer/labware-ingred/actions'
import { getAdditionalEquipmentEntities } from '/protocol-designer/step-forms/selectors'
import { START_TERMINAL_ITEM_ID } from '/protocol-designer/steplist'
import {
  getLabwareIsCompatible,
  getLabwareIsCustom,
} from '/protocol-designer/utils/labwareModuleCompatibility'

import { DECK_CONTROLS_STYLE } from '../constants'
import { BlockedSlot } from './BlockedSlot'
import { SlotOverlay } from './SlotOverlay'

import type { DropTargetMonitor } from 'react-dnd'
import type {
  AddressableAreaName,
  CutoutId,
  DeckDefinition,
  Dimensions,
  ModuleType,
} from '@opentrons/shared-data'
import type { DroppedItem, SharedControlsType } from '../types'

interface SlotControlsProps extends SharedControlsType {
  addEquipment: (slotId: string) => void
  stagingAreaAddressableAreas: AddressableAreaName[]
  deckDef: DeckDefinition
  slotBoundingBox: Dimensions
  //  NOTE: slotId can be either AddressableAreaName or moduleId
  slotId: string
  moduleType: ModuleType | null
  handleDragHover?: () => void
}

export const SlotControls = (props: SlotControlsProps): JSX.Element | null => {
  const {
    slotBoundingBox,
    slotPosition,
    slotId,
    moduleType,
    hover,
    handleDragHover,
    setHover,
    addEquipment,
    itemId,
    terminalItemId,
    isSelected,
    deckDef,
    stagingAreaAddressableAreas,
  } = props
  const customLabwareDefs = useSelector(
    labwareDefSelectors.getCustomLabwareDefsByURI
  )
  const isSlotAVacuumDock = getIsSlotAVacuumDock(itemId)
  const isSlotAHopper = getIsSlotAHopper(itemId)
  const additionalEquipment = useSelector(getAdditionalEquipmentEntities)
  const cutoutId =
    isSlotAHopper || isSlotAVacuumDock
      ? null
      : getCutoutIdFromAddressableArea(itemId, deckDef)
  const trashSlots = Object.values(additionalEquipment)
    .filter(ae => ae.name === 'trashBin' || ae.name === 'wasteChute')
    ?.map(ae => ae.location as CutoutId)

  const hasTrash = cutoutId != null ? trashSlots.includes(cutoutId) : false
  const hasTrashAndNotD4 =
    hasTrash &&
    //  to allow for drag/drop into D4 next to a waste chute
    !stagingAreaAddressableAreas.includes(itemId as AddressableAreaName)

  const ref = useRef(null)
  const dispatch = useDispatch()
  const { t } = useTranslation(['deck', 'starting_deck_state'])

  const [, drag] = useDrag({
    type: DND_TYPES.LABWARE,
    item: { labwareOnDeck: null },
  })

  const [{ draggedItem, itemType, isOver }, drop] = useDrop(
    () => ({
      accept: DND_TYPES.LABWARE,
      canDrop: (item: DroppedItem) => {
        const draggedDef = item?.labwareOnDeck?.def
        console.assert(
          draggedDef != null,
          'no labware def of dragged def, expected it on drop'
        )
        if (moduleType != null && draggedDef != null) {
          // this is a module slot, prevent drop if the dragged labware is not compatible
          const isCustomLabware = getLabwareIsCustom(
            customLabwareDefs,
            item.labwareOnDeck
          )

          return (
            moduleType !== FLEX_STACKER_MODULE_TYPE &&
            (getLabwareIsCompatible(draggedDef, moduleType) || isCustomLabware)
          )
        }
        return !hasTrashAndNotD4
      },
      drop: (item: DroppedItem) => {
        const droppedLabware = item
        if (droppedLabware.labwareOnDeck != null) {
          dispatch(moveDeckItem(droppedLabware.labwareOnDeck.stack[1], slotId))
        }
      },
      hover: () => {
        if (handleDragHover != null) {
          handleDragHover()
        }
      },
      collect: (monitor: DropTargetMonitor) => ({
        itemType: monitor.getItemType(),
        isOver: !!monitor.isOver({ shallow: true }),
        draggedItem: monitor.getItem() as DroppedItem,
      }),
    }),
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [moduleType, hasTrashAndNotD4, customLabwareDefs]
  )

  if (
    (itemType !== DND_TYPES.LABWARE && itemType !== null) ||
    slotPosition == null ||
    terminalItemId !== START_TERMINAL_ITEM_ID ||
    isSelected
  ) {
    return null
  }

  const draggedDef = draggedItem?.labwareOnDeck?.def
  // when dragging labware over a slot many times quickly
  // labwareOnDeck could be null/undefined and cause the white screen
  const isCustomLabware =
    draggedItem?.labwareOnDeck != null
      ? getLabwareIsCustom(customLabwareDefs, draggedItem?.labwareOnDeck)
      : false

  const isSlotBlocked =
    (isOver &&
      moduleType != null &&
      draggedDef != null &&
      !getLabwareIsCompatible(draggedDef, moduleType) &&
      !isCustomLabware) ||
    (isOver && hasTrashAndNotD4) ||
    //  TODO: temp prohibit swapping on stacker,
    //  will add that feature in the future
    (isOver && moduleType === FLEX_STACKER_MODULE_TYPE)

  drag(drop(ref))

  const hoverOpacity = (hover != null && hover === itemId) || isOver ? 1 : 0

  let body = (
    <RobotCoordsForeignDiv
      dataTestId={itemId}
      x={slotPosition[0]}
      y={slotPosition[1]}
      width={slotBoundingBox.xDimension}
      height={slotBoundingBox.yDimension}
      innerDivProps={{
        opacity: hoverOpacity,
        ...DECK_CONTROLS_STYLE,
      }}
      innerDivEvents={{
        onMouseEnter: () => {
          setHover(itemId)
        },
        onMouseLeave: () => {
          setHover(null)
        },
        onClick: () => {
          if (!isOver) {
            addEquipment(itemId)
          }
        },
      }}
    >
      <Flex
        width={slotBoundingBox.xDimension}
        height={slotBoundingBox.yDimension}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        <Link role="button">
          <StyledText desktopStyle="bodyLargeSemiBold">
            {t('starting_deck_state:add_labware')}
          </StyledText>
        </Link>
      </Flex>
    </RobotCoordsForeignDiv>
  )
  if (isSlotBlocked) {
    body = <BlockedSlot slotPosition={slotPosition} slotId={itemId} />
  } else if (isOver) {
    body = (
      <SlotOverlay
        slotPosition={slotPosition}
        slotId={itemId}
        slotFillColor={`${COLORS.black90}cc`}
        slotFillOpacity="1"
      >
        <Flex
          width={slotBoundingBox.xDimension}
          height={slotBoundingBox.yDimension}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          color={COLORS.white}
        >
          <Link role="button">
            <StyledText desktopStyle="bodyLargeSemiBold">
              {t(`overlay.slot.place_here`)}
            </StyledText>
          </Link>
        </Flex>
      </SlotOverlay>
    )
  }
  return (
    <g ref={ref} style={{ cursor: CURSOR_POINTER }}>
      {body}
    </g>
  )
}
