import { useRef, useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { useTranslation } from 'react-i18next'

import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  SPACING,
} from '@opentrons/components'

import { DND_TYPES } from '/protocol-designer/constants'

import { ConnectedStepInfo } from './ConnectedStepInfo'

import type { Dispatch, SetStateAction } from 'react'
import type { DragLayerMonitor, DropTargetMonitor } from 'react-dnd'
import type { StepIdType } from '/protocol-designer/form-types'

interface DraggableStepsProps {
  orderedStepIds: StepIdType[]
  reorderSteps: (steps: StepIdType[]) => void
  sidebarWidth: number
}
export function DraggableSteps(props: DraggableStepsProps): JSX.Element | null {
  const { orderedStepIds, reorderSteps, sidebarWidth } = props
  const { t } = useTranslation('shared')
  const [openedOverflowMenuId, setOpenedOverflowMenuId] = useState<
    string | null
  >(null)

  const findStepIndex = (stepId: StepIdType): number =>
    orderedStepIds.findIndex(id => stepId === id)

  const moveStep = (stepId: StepIdType, targetIndex: number): void => {
    const currentIndex = findStepIndex(stepId)

    const currentRemoved = [
      ...orderedStepIds.slice(0, currentIndex),
      ...orderedStepIds.slice(currentIndex + 1, orderedStepIds.length),
    ]
    // need to account for whether we are dragging onto a step above or below the current step
    const reinsertOffset = currentIndex < targetIndex ? 1 : 0
    const currentReinserted = [
      ...currentRemoved.slice(0, targetIndex - reinsertOffset),
      stepId,
      ...currentRemoved.slice(
        targetIndex - reinsertOffset,
        currentRemoved.length
      ),
    ]
    if (confirm(t('confirm_reorder') as string)) {
      reorderSteps(currentReinserted)
    }
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} width="100%">
      {orderedStepIds.map((stepId: StepIdType, index: number) => (
        <DragDropStep
          key={`${stepId}_${index}`}
          stepNumber={index + 1}
          stepId={stepId}
          moveStep={moveStep}
          findStepIndex={findStepIndex}
          orderedStepIds={orderedStepIds}
          openedOverflowMenuId={openedOverflowMenuId}
          setOpenedOverflowMenuId={setOpenedOverflowMenuId}
          sidebarWidth={sidebarWidth}
        />
      ))}
    </Flex>
  )
}

interface DropType {
  stepId: StepIdType
}

interface ConnectedStepItemProps {
  stepId: StepIdType
  stepNumber: number
  onStepContextMenu?: () => void
}

interface DragDropStepProps extends ConnectedStepItemProps {
  stepId: StepIdType
  moveStep: (stepId: StepIdType, value: number) => void

  findStepIndex: (stepId: StepIdType) => number
  orderedStepIds: string[]
  openedOverflowMenuId?: string | null
  setOpenedOverflowMenuId?: Dispatch<SetStateAction<string | null>>
  sidebarWidth: number
}

function DragDropStep(props: DragDropStepProps): JSX.Element {
  const {
    stepId,
    moveStep,
    findStepIndex,
    orderedStepIds,
    stepNumber,
    openedOverflowMenuId,
    setOpenedOverflowMenuId,
    sidebarWidth,
  } = props
  const stepRef = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DND_TYPES.STEP_ITEM,
      item: { stepId },
      collect: (monitor: DragLayerMonitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [orderedStepIds]
  )

  const [{ handlerId, hovered }, drop] = useDrop(
    () => ({
      accept: DND_TYPES.STEP_ITEM,
      canDrop: () => {
        return true
      },
      drop: (item: DropType) => {
        const draggedId = item.stepId
        const draggedIndex = findStepIndex(draggedId)
        const overIndex = findStepIndex(stepId)
        // if hovering the step immediately below, don't move (the preview bar is at the step's current position)
        if (draggedIndex !== overIndex && draggedIndex !== overIndex - 1) {
          moveStep(draggedId, overIndex)
        }
      },
      collect: (monitor: DropTargetMonitor) => ({
        handlerId: monitor.getHandlerId(),
        hovered: monitor.isOver(),
      }),
    }),
    [orderedStepIds]
  )

  drag(drop(stepRef))
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      opacity={isDragging ? 0.3 : 1}
      ref={stepRef}
      data-handler-id={handlerId}
    >
      {hovered && <DragDropPreviewBar />}
      <ConnectedStepInfo
        openedOverflowMenuId={openedOverflowMenuId}
        setOpenedOverflowMenuId={setOpenedOverflowMenuId}
        stepNumber={stepNumber}
        stepId={stepId}
        sidebarWidth={sidebarWidth}
      />
    </Flex>
  )
}

/** A horizontal divider indicating where the step will be placed. */
function DragDropPreviewBar(): JSX.Element {
  return (
    <Box paddingY={SPACING.spacing2}>
      <Divider
        marginY="0"
        borderBottom="none"
        height="0.25rem" // 4px
        width="100%"
        backgroundColor={COLORS.blue50}
        borderRadius="0.125rem" // half of height
      />
    </Box>
  )
}
