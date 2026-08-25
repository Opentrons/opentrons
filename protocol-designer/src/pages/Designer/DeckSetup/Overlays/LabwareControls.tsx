import { useEffect, useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  COLORS,
  CURSOR_GRAB,
  Flex,
  JUSTIFY_CENTER,
  Link,
  RobotCoordsForeignDiv,
  StyledText,
  TYPOGRAPHY,
  WHITE_SPACE_PRE_WRAP,
} from '@opentrons/components'
import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'
import {
  getIsSlotAHopper,
  getTopLocationInStack,
} from '@opentrons/step-generation'

import { DND_TYPES } from '/protocol-designer/constants'
import { moveDeckItem } from '/protocol-designer/labware-ingred/actions'
import { START_TERMINAL_ITEM_ID } from '/protocol-designer/steplist'

import { DECK_CONTROLS_STYLE } from '../constants'
import { BlockedSlot } from './BlockedSlot'
import { SlotOverlay } from './SlotOverlay'

import type { DropTargetMonitor } from 'react-dnd'
import type { LabwareOnDeck, ModuleOnDeck } from '/protocol-designer/step-forms'
import type { ThunkDispatch } from '/protocol-designer/types'
import type { DroppedItem, SharedControlsType } from '../types'

interface LabwareControlsProps extends SharedControlsType {
  labwareOnDeck: LabwareOnDeck
  setHoveredLabware: (labware?: LabwareOnDeck | null) => void
  swapBlocked: boolean
  allModules: ModuleOnDeck[]
}

export const LabwareControls = (
  props: LabwareControlsProps
): JSX.Element | null => {
  const {
    labwareOnDeck,
    slotPosition,
    setHoveredLabware,
    swapBlocked,
    hover,
    setHover,
    setShowMenuListForId,
    isSelected,
    terminalItemId,
    itemId,
    allModules,
  } = props
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const ref = useRef(null)
  const canDropRef = useRef(false)
  const { t } = useTranslation(['starting_deck_state', 'deck'])
  const stackerSlots = Object.values(allModules)
    .filter(module => module.type === FLEX_STACKER_MODULE_TYPE)
    ?.map(module => module.slot)
  //  NOTE: we will temporary prevent drag & drop on the stacker
  //  until we define the rules for dragging a whole stack better
  const prohibitDragAndDrop =
    getIsSlotAHopper(itemId) || stackerSlots.includes(itemId)
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DND_TYPES.LABWARE,
      item: { labwareOnDeck },
      canDrag: () => !prohibitDragAndDrop,
      collect: monitor => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [labwareOnDeck, prohibitDragAndDrop]
  )

  const [{ isOver, draggedLabware, canDrop }, drop] = useDrop(
    () => ({
      accept: DND_TYPES.LABWARE,
      canDrop: (item: DroppedItem) => {
        if (prohibitDragAndDrop) {
          return false
        }
        const draggedLabware = item?.labwareOnDeck
        const isDifferentSlot =
          draggedLabware &&
          getTopLocationInStack(draggedLabware.stack) !==
            getTopLocationInStack(labwareOnDeck.stack)
        return isDifferentSlot && !swapBlocked
      },
      drop: (item: DroppedItem) => {
        const draggedLabware = item?.labwareOnDeck
        if (draggedLabware != null) {
          dispatch(
            moveDeckItem(draggedLabware.stack[1], labwareOnDeck.stack[1])
          )
        }
      },
      hover: () => {
        setHoveredLabware(labwareOnDeck)
      },
      collect: (monitor: DropTargetMonitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        draggedLabware: monitor.getItem() as DroppedItem,
        canDrop: monitor.canDrop(),
      }),
    }),
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labwareOnDeck, swapBlocked]
  )

  // todo(mm, 2026-03-06): Is this ref+useEffect doing anything? Can we just use canDrop on its own?
  useEffect(() => {
    canDropRef.current = canDrop
  }, [canDrop])

  useEffect(
    () => {
      if (draggedLabware == null) {
        setHoveredLabware(null)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draggedLabware]
  )

  const isBeingDragged =
    draggedLabware?.labwareOnDeck?.stack != null &&
    getTopLocationInStack(draggedLabware?.labwareOnDeck?.stack) ===
      getTopLocationInStack(labwareOnDeck.stack)

  drag(drop(ref))

  if (
    terminalItemId !== START_TERMINAL_ITEM_ID ||
    isSelected ||
    slotPosition == null
  ) {
    return null
  }
  const isLabwareSwapping =
    draggedLabware?.labwareOnDeck?.stack != null &&
    getTopLocationInStack(draggedLabware?.labwareOnDeck?.stack) !==
      getTopLocationInStack(labwareOnDeck.stack)
  const [x, y] = slotPosition
  const width = labwareOnDeck.def.dimensions.xDimension
  const height = labwareOnDeck.def.dimensions.yDimension

  const getDisplayText = (): string => {
    if (isDragging) {
      return t('deck:overlay.slot.drag_to_new_slot')
    } else if (isOver && canDrop) {
      if (isLabwareSwapping) {
        return t('deck:overlay.slot.swap_labware')
      } else {
        return t('deck:overlay.slot.place_here')
      }
    } else if (!isDragging && !isBeingDragged && !isOver && !canDrop) {
      return t('edit_labware')
    } else {
      return ''
    }
  }

  let hoverOpacity = 0
  if ((isOver && canDrop) || hover === itemId) {
    hoverOpacity = 1
  }

  const hoverInfo = (
    <Flex
      ref={ref}
      width={width}
      height={height}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      color={!isDragging ? COLORS.white : `${COLORS.black90}cc`}
      textAlign={TYPOGRAPHY.textAlignCenter}
    >
      <Link role="button">
        <StyledText
          desktopStyle="bodyLargeSemiBold"
          whiteSpace={WHITE_SPACE_PRE_WRAP}
          width={
            getDisplayText() === t('deck:overlay.slot.drag_to_new_slot')
              ? '5.125rem'
              : '100%'
          }
        >
          {getDisplayText()}
        </StyledText>
      </Link>
    </Flex>
  )

  let body = (
    <RobotCoordsForeignDiv
      {...{ x, y, width, height }}
      dataTestId={itemId}
      innerDivProps={{
        opacity: hoverOpacity,
        ...DECK_CONTROLS_STYLE,
        zIndex: isOver && canDrop ? 10 : 'auto',
        // NOTE: cursor is inconsistent when dragging due to an active
        // react dnd bug: https://github.com/react-dnd/react-dnd/issues/325
        cursor: CURSOR_GRAB,
        backgroundColor:
          draggedLabware != null ? COLORS.white : `${COLORS.black90}cc`,
      }}
      innerDivEvents={{
        onMouseEnter: () => {
          setHover(itemId)
        },
        onMouseLeave: () => {
          setHover(null)
        },
        onClick: () => {
          if (!isBeingDragged) {
            setShowMenuListForId(itemId)
          }
        },
      }}
    >
      {hoverInfo}
    </RobotCoordsForeignDiv>
  )

  if (swapBlocked) {
    body = <BlockedSlot slotId={itemId} slotPosition={slotPosition} />
  } else if (canDropRef.current && isLabwareSwapping) {
    body = (
      <SlotOverlay
        slotId={itemId}
        slotPosition={slotPosition}
        slotFillColor={`${COLORS.black90}cc`}
        slotFillOpacity={hoverOpacity.toString()}
      >
        {hoverInfo}
      </SlotOverlay>
    )
  }
  return <>{body}</>
}
