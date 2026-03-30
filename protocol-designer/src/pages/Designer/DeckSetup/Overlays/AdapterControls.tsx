import { useRef } from 'react'
import { useDrop } from 'react-dnd'
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

import { DND_TYPES } from '/protocol-designer/constants'
import { selectors as labwareDefSelectors } from '/protocol-designer/labware-defs'
import { moveDeckItem } from '/protocol-designer/labware-ingred/actions'
import { getLabwareEntities } from '/protocol-designer/step-forms/selectors'
import { START_TERMINAL_ITEM_ID } from '/protocol-designer/steplist'
import { getLabwareIsCustom } from '/protocol-designer/utils/labwareModuleCompatibility'

import { DECK_CONTROLS_STYLE } from '../constants'
import { BlockedSlot } from './BlockedSlot'
import { SlotOverlay } from './SlotOverlay'

import type { DropTargetMonitor } from 'react-dnd'
import type { Dimensions } from '@opentrons/shared-data'
import type { DroppedItem, SharedControlsType } from '../types'

interface AdapterControlsProps extends SharedControlsType {
  slotBoundingBox: Dimensions
  //    the adapter's labwareId
  labwareId: string
  onDeck: boolean
  swapBlocked: boolean
  handleDragHover?: () => void
}

export const AdapterControls = (
  props: AdapterControlsProps
): JSX.Element | null => {
  const {
    slotPosition,
    slotBoundingBox,
    labwareId,
    onDeck,
    handleDragHover,
    hover,
    setHover,
    setShowMenuListForId,
    itemId,
    isSelected,
    terminalItemId,
    swapBlocked,
  } = props
  const { t } = useTranslation(['deck', 'starting_deck_state'])
  const customLabwareDefs = useSelector(
    labwareDefSelectors.getCustomLabwareDefsByURI
  )
  const labwareEntities = useSelector(getLabwareEntities)
  const adapterLoadName = labwareEntities[labwareId]?.def.parameters.loadName

  if (adapterLoadName == null) {
    console.error(
      `expected to find the adapter loadname from labwareId ${labwareId} but could not`
    )
  }

  const ref = useRef(null)
  const dispatch = useDispatch()

  const [{ itemType, draggedItem, isOver }, drop] = useDrop(
    () => ({
      accept: DND_TYPES.LABWARE,
      canDrop: (item: DroppedItem) => {
        const draggedDef = item.labwareOnDeck?.def
        console.assert(
          draggedDef != null,
          'no labware def of dragged item, expected it on drop'
        )

        if (draggedDef != null) {
          const isCustomLabware = getLabwareIsCustom(
            customLabwareDefs,
            item.labwareOnDeck
          )
          const adapterLabwareIsMatch =
            draggedDef.stackingOffsetWithLabware?.[adapterLoadName] != null

          return (adapterLabwareIsMatch || isCustomLabware) && !swapBlocked
        }
        return true
      },
      drop: (item: DroppedItem) => {
        const droppedLabware = item
        if (droppedLabware.labwareOnDeck != null) {
          dispatch(
            moveDeckItem(droppedLabware.labwareOnDeck.stack[1], labwareId)
          )
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
    [swapBlocked, customLabwareDefs]
  )

  if (
    (itemType !== DND_TYPES.LABWARE && itemType !== null) ||
    terminalItemId !== START_TERMINAL_ITEM_ID ||
    isSelected ||
    slotPosition == null
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
    isOver &&
    draggedDef != null &&
    draggedDef.stackingOffsetWithLabware?.[adapterLoadName] == null &&
    !isCustomLabware

  drop(ref)

  const hoverOpacity = (hover != null && hover === itemId) || isOver ? 1 : 0

  let body = (
    <RobotCoordsForeignDiv
      dataTestId={itemId}
      x={onDeck ? slotPosition[0] : 0}
      y={onDeck ? slotPosition[1] : 0}
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
            setShowMenuListForId(itemId)
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
            {t('starting_deck_state:edit_labware')}
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
