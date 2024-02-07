import * as React from 'react'
import { useSelector } from 'react-redux'
import {
  DragLayerMonitor,
  DropTargetMonitor,
  useDrop,
  useDrag,
} from 'react-dnd'
import isEqual from 'lodash/isEqual'

import { DND_TYPES } from '../../constants'
import { selectors as stepFormSelectors } from '../../step-forms'
import { stepIconsByType, StepIdType } from '../../form-types'
import {
  ConnectedStepItem,
  ConnectedStepItemProps,
} from '../../containers/ConnectedStepItem'
import { PDTitledList } from '../lists'
import { ContextMenu } from './ContextMenu'

import styles from './StepItem.css'

interface DragDropStepItemProps extends ConnectedStepItemProps {
  stepId: StepIdType
  stepNumber: number
  findStepIndex: (stepIdType: StepIdType) => number
  onDrag: () => void
  moveStep: (stepId: StepIdType, value: number) => void
}

const DragDropStepItem = (props: DragDropStepItemProps): JSX.Element => {
  const { onDrag, stepId, findStepIndex, moveStep } = props
  console.log('stepId', stepId)
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DND_TYPES.STEP_ITEM,
    beginDrag: () => {
      onDrag()
      return { stepId: stepId }
    },
    collect: (monitor: DragLayerMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  const [, drop] = useDrop(() => ({
    accept: DND_TYPES.STEP_ITEM,
    canDrop: () => {
      return false
    },
    hover: (item: any) => {
      console.log('item', item)
      const draggedId = item.stepId

      if (draggedId !== stepId) {
        const overIndex = findStepIndex(stepId)
        moveStep(draggedId, overIndex)
      }
    },
  }))

  return (
    <div ref={drop} style={{ opacity: isDragging ? 0.3 : 1 }}>
      <div ref={drag}>
        <ConnectedStepItem {...props} stepId={stepId} />
      </div>
    </div>
  )
}

interface StepItemsProps {
  orderedStepIds: StepIdType[]
  reorderSteps: (steps: StepIdType[]) => void
}
export const DraggableStepItems = (props: StepItemsProps): JSX.Element => {
  const { orderedStepIds, reorderSteps } = props
  const [stepIds, setStepIds] = React.useState<StepIdType[]>(orderedStepIds)

  const onDrag = (): void => {
    setStepIds(orderedStepIds)
  }

  const submitReordering = (): void => {
    if (
      confirm(
        'Are you sure you want to reorder these steps, it may cause errors?'
      )
    ) {
      reorderSteps(stepIds)
    }
  }

  const [{ isOver }, drop] = useDrop(() => ({
    accept: DND_TYPES.STEP_ITEM,
    drop: () => {
      if (!isEqual(orderedStepIds, stepIds)) {
        submitReordering()
      }
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }))

  // TODO: BC 2018-11-27 make util function for reordering and use it in hotkey implementation too
  const moveStep = (stepId: StepIdType, targetIndex: number): void => {
    const currentIndex = findStepIndex(stepId)
    const currentRemoved = [
      ...stepIds.slice(0, currentIndex),
      ...stepIds.slice(currentIndex + 1, stepIds.length),
    ]
    const currentReinserted = [
      ...currentRemoved.slice(0, targetIndex),
      stepId,
      ...currentRemoved.slice(targetIndex, currentRemoved.length),
    ]
    setStepIds(currentReinserted)
  }

  const findStepIndex = (stepId: StepIdType): number =>
    stepIds.findIndex(id => stepId === id)

  const currentIds = isOver ? stepIds : orderedStepIds
  console.log('stepIds', stepIds)
  console.log('currentStepIds', currentIds)
  return (
    <div ref={drop}>
      <ContextMenu>
        {({ makeStepOnContextMenu }) =>
          currentIds.map((stepId: StepIdType, index: number) => (
            <DragDropStepItem
              key={`${stepId}_${index}`}
              stepNumber={index + 1}
              stepId={stepId}
              onStepContextMenu={() => makeStepOnContextMenu(stepId)}
              findStepIndex={findStepIndex}
              onDrag={onDrag}
              moveStep={moveStep}
            />
          ))
        }
      </ContextMenu>
      <StepDragPreview />
    </div>
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
