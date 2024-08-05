import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import {
  Flex,
  LegacyStyledText,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import { openAddLabwareModal } from '../../../labware-ingred/actions'
import { START_TERMINAL_ITEM_ID } from '../../../steplist'

import type { CoordinateTuple, Dimensions } from '@opentrons/shared-data'
import type { TerminalItemId } from '../../../steplist'
import { css } from 'styled-components'

interface ControlSelectProps {
  slotPosition: CoordinateTuple | null
  slotBoundingBox: Dimensions
  //  NOTE: slotId can be either AddressableAreaName or moduleId
  slotId: string
  addEquipment: (slotId: string) => void
  selectedTerminalItemId?: TerminalItemId | null
}

export const ControlSelect = (
  props: ControlSelectProps
): JSX.Element | null => {
  const {
    slotBoundingBox,
    slotPosition,
    slotId,
    selectedTerminalItemId,
    addEquipment,
  } = props
  //   const customLabwareDefs = useSelector(
  //     labwareDefSelectors.getCustomLabwareDefsByURI
  //   )
  //   const ref = React.useRef(null)
  const dispatch = useDispatch()

  const { t } = useTranslation('deck')

  //   const [, drag] = useDrag({
  //     type: DND_TYPES.LABWARE,
  //     item: { labwareOnDeck: null },
  //   })

  //   const [{ draggedItem, itemType, isOver }, drop] = useDrop(
  //     () => ({
  //       accept: DND_TYPES.LABWARE,
  //       canDrop: (item: DroppedItem) => {
  //         const draggedDef = item?.labwareOnDeck?.def
  //         console.assert(
  //           draggedDef,
  //           'no labware def of dragged item, expected it on drop'
  //         )

  //         if (moduleType != null && draggedDef != null) {
  //           // this is a module slot, prevent drop if the dragged labware is not compatible
  //           const isCustomLabware = getLabwareIsCustom(
  //             customLabwareDefs,
  //             item.labwareOnDeck
  //           )

  //           return (
  //             getLabwareIsCompatible(draggedDef, moduleType) || isCustomLabware
  //           )
  //         }
  //         return true
  //       },
  //       drop: (item: DroppedItem) => {
  //         const droppedLabware = item
  //         if (droppedLabware.labwareOnDeck != null) {
  //           const droppedSlot = droppedLabware.labwareOnDeck.slot
  //           dispatch(moveDeckItem(droppedSlot, slotId))
  //         }
  //       },
  //       hover: () => {
  //         if (handleDragHover != null) {
  //           handleDragHover()
  //         }
  //       },
  //       collect: (monitor: DropTargetMonitor) => ({
  //         itemType: monitor.getItemType(),
  //         isOver: !!monitor.isOver(),
  //         draggedItem: monitor.getItem() as DroppedItem,
  //       }),
  //     }),
  //     []
  //   )

  if (selectedTerminalItemId !== START_TERMINAL_ITEM_ID || slotPosition == null)
    return null

  //   const draggedDef = draggedItem?.labwareOnDeck?.def

  //   const isCustomLabware = draggedItem
  //     ? getLabwareIsCustom(customLabwareDefs, draggedItem.labwareOnDeck)
  //     : false

  //   let slotBlocked: string | null = null
  //   if (
  //     isOver &&
  //     moduleType != null &&
  //     draggedDef != null &&
  //     !getLabwareIsCompatible(draggedDef, moduleType) &&
  //     !isCustomLabware
  //   ) {
  //     slotBlocked = 'Labware incompatible with this module'
  //   }

  //   const isOnHeaterShaker = moduleType === 'heaterShakerModuleType'
  //   const isNoAdapterOption =
  //     moduleType === 'magneticBlockType' ||
  //     moduleType === 'magneticModuleType' ||
  //     moduleType === 'thermocyclerModuleType'
  //   let overlayText: string = 'add_adapter_or_labware'
  //   if (isOnHeaterShaker) {
  //     overlayText = 'add_adapter'
  //   } else if (isNoAdapterOption) {
  //     overlayText = 'add_labware'
  //   }
  console.log('slotId', slotId)

  //   drag(drop(ref))

  return (
    <RobotCoordsForeignDiv
      x={slotPosition[0]}
      y={slotPosition[1]}
      width={slotBoundingBox.xDimension}
      height={slotBoundingBox.yDimension}
      innerDivProps={{
        onClick: () => addEquipment(slotId),
      }}
    >
      <Flex
        css={css`
          opacity: 0;

          &:hover {
            opacity: 1;
          }
        `}
      >
        <a
          onClick={() => {
            addEquipment(slotId)
          }}
        >
          <LegacyStyledText>select</LegacyStyledText>
        </a>
      </Flex>
    </RobotCoordsForeignDiv>
  )
}
