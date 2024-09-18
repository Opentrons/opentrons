import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useDrop, useDrag } from 'react-dnd'
import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
} from '@opentrons/components'
import { DND_TYPES } from '../../../../constants'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { stepIconsByType } from '../../../../form-types'
import { StepContainer } from './StepContainer'
import { ConnectedStepInfo } from './ConnectedStepInfo'
import type { DragLayerMonitor, DropTargetOptions } from 'react-dnd'
import type { StepIdType } from '../../../../form-types'
import type { ConnectedStepItemProps } from '../../../../containers/ConnectedStepItem'

interface DragDropStepProps extends ConnectedStepItemProps {
  stepId: StepIdType
  moveStep: (stepId: StepIdType, value: number) => void
  findStepIndex: (stepId: StepIdType) => number
  orderedStepIds: string[]
}

interface DropType {
  stepId: StepIdType
}

function DragDropStep(props: DragDropStepProps): JSX.Element {
  const { stepId, moveStep, findStepIndex, orderedStepIds, stepNumber } = props
  const stepRef = React.useRef<HTMLDivElement>(null)

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

  const [{ handlerId }, drop] = useDrop(
    () => ({
      accept: DND_TYPES.STEP_ITEM,
      canDrop: () => {
        return true
      },
      drop: (item: DropType) => {
        const draggedId = item.stepId
        if (draggedId !== stepId) {
          const overIndex = findStepIndex(stepId)
          moveStep(draggedId, overIndex)
        }
      },
      collect: (monitor: DropTargetOptions) => ({
        handlerId: monitor.getHandlerId(),
      }),
    }),
    [orderedStepIds]
  )

  drag(drop(stepRef))
  return (
    <Box
      ref={stepRef}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      data-handler-id={handlerId}
    >
      <ConnectedStepInfo stepNumber={stepNumber} stepId={stepId} />
    </Box>
  )
}

interface DraggableStepsProps {
  orderedStepIds: StepIdType[]
  reorderSteps: (steps: StepIdType[]) => void
}
export function DraggableSteps(props: DraggableStepsProps): JSX.Element | null {
  const { orderedStepIds, reorderSteps } = props
  const { t } = useTranslation('shared')

  const findStepIndex = (stepId: StepIdType): number =>
    orderedStepIds.findIndex(id => stepId === id)

  const moveStep = (stepId: StepIdType, targetIndex: number): void => {
    const currentIndex = findStepIndex(stepId)

    const currentRemoved = [
      ...orderedStepIds.slice(0, currentIndex),
      ...orderedStepIds.slice(currentIndex + 1, orderedStepIds.length),
    ]
    const currentReinserted = [
      ...currentRemoved.slice(0, targetIndex),
      stepId,
      ...currentRemoved.slice(targetIndex, currentRemoved.length),
    ]
    if (confirm(t('confirm_reorder') as string)) {
      reorderSteps(currentReinserted)
    }
  }

  return (
    <Flex
      gridGap={SPACING.spacing4}
      flexDirection={DIRECTION_COLUMN}
      width="100%"
    >
      {orderedStepIds.map((stepId: StepIdType, index: number) => (
        <DragDropStep
          key={`${stepId}_${index}`}
          stepNumber={index + 1}
          stepId={stepId}
          moveStep={moveStep}
          findStepIndex={findStepIndex}
          orderedStepIds={orderedStepIds}
        />
      ))}
      <StepDragPreview />
    </Flex>
  )
}

function StepDragPreview(): JSX.Element | null {
  const [{ isDragging, itemType, item, currentOffset }] = useDrag(() => ({
    type: DND_TYPES.STEP_ITEM,
    collect: (monitor: DragLayerMonitor) => ({
      currentOffset: monitor.getSourceClientOffset(),
      isDragging: monitor.isDragging(),
      itemType: monitor.getItemType(),
      item: monitor.getItem() as { stepId: StepIdType },
    }),
  }))

  const savedStepForms = useSelector(stepFormSelectors.getSavedStepForms)
  const savedForm = item && savedStepForms[item.stepId]
  const { stepType, stepName } = savedForm || {}

  if (
    itemType !== DND_TYPES.STEP_ITEM ||
    !isDragging ||
    stepType == null ||
    currentOffset == null
  ) {
    return null
  }

  return (
    <Flex cursor="grabbing" backgroundColor={COLORS.transparent}>
      <StepContainer
        iconName={stepIconsByType[stepType]}
        title={stepName || ''}
      />
    </Flex>
  )
}
