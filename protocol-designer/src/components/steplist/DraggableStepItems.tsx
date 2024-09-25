import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useDrop, useDrag } from 'react-dnd'

import { DND_TYPES } from '../../constants'
import { selectors as stepFormSelectors } from '../../step-forms'
import { stepIconsByType } from '../../form-types'
import { ConnectedStepItem } from '../../containers/ConnectedStepItem'
import { PDTitledList } from '../lists'
import { ContextMenu } from './ContextMenu'
import styles from './StepItem.module.css'
import type { DragLayerMonitor, DropTargetOptions } from 'react-dnd'
import type { StepIdType } from '../../form-types'
import type { ConnectedStepItemProps } from '../../containers/ConnectedStepItem'

interface DragDropStepItemProps extends ConnectedStepItemProps {
  stepId: StepIdType
  moveStep: (stepId: StepIdType, value: number) => void
  findStepIndex: (stepId: StepIdType) => number
  orderedStepIds: string[]
}

interface DropType {
  stepId: StepIdType
}

const DragDropStepItem = (props: DragDropStepItemProps): JSX.Element => {
  const { stepId, moveStep, findStepIndex, orderedStepIds } = props
  const ref = useRef<HTMLDivElement>(null)

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

  drag(drop(ref))
  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      data-handler-id={handlerId}
    >
      <ConnectedStepItem {...props} stepId={stepId} />
    </div>
  )
}

interface StepItemsProps {
  orderedStepIds: StepIdType[]
  reorderSteps: (steps: StepIdType[]) => void
}
export const DraggableStepItems = (
  props: StepItemsProps
): JSX.Element | null => {
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
    <>
      <ContextMenu>
        {({ makeStepOnContextMenu }) =>
          orderedStepIds.map((stepId: StepIdType, index: number) => (
            <DragDropStepItem
              key={`${stepId}_${index}`}
              stepNumber={index + 1}
              stepId={stepId}
              //  @ts-expect-error
              onStepContextMenu={makeStepOnContextMenu(stepId)}
              moveStep={moveStep}
              findStepIndex={findStepIndex}
              orderedStepIds={orderedStepIds}
            />
          ))
        }
      </ContextMenu>
      <StepDragPreview />
    </>
  )
}

const NAV_OFFSET = 64

const StepDragPreview = (): JSX.Element | null => {
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
    !stepType ||
    !currentOffset
  )
    return null
  return (
    <div
      className={styles.step_drag_preview}
      style={{ left: currentOffset.x - NAV_OFFSET, top: currentOffset.y }}
    >
      <PDTitledList
        iconName={stepIconsByType[stepType]}
        title={stepName || ''}
        onCollapseToggle={() => {}} // NOTE: necessary to render chevron
        collapsed
      />
    </div>
  )
}
