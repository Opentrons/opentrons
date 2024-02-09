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
  index: number
  moveStep: (dragIndex: number, hoverIndex: number) => void
}

const DragDropStepItem = (props: DragDropStepItemProps): JSX.Element => {
  const { stepId, index, moveStep } = props
  const ref = React.useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag({
    type: DND_TYPES.STEP_ITEM,
    item: { stepId, index },

    // beginDrag: () => {
    //   console.log('you his the onDrag Begin')
    //   onDragBegin()
    //   return { stepId: stepId } // Ensure stepId is captured correctly
    // },
    collect: (monitor: DragLayerMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop(() => ({
    accept: DND_TYPES.STEP_ITEM,
    canDrop: () => {
      return false
    },
    hover: (item: { index?: number }, monitor: DropTargetMonitor) => {
      if (!ref.current || !item.index) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      if (dragIndex === hoverIndex) {
        return
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect()
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      if (!clientOffset) {
        return
      }
      const hoverClientY = clientOffset.y - hoverBoundingRect.top

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }
      console.log('dragIndex', dragIndex)
      console.log('hoverINdex', hoverIndex)
      moveStep(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
  }))

  drag(drop(ref))
  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.3 : 1 }}>
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
  const [stepIds, setStepIds] = React.useState<StepIdType[]>(orderedStepIds)
  const ref = React.useRef<HTMLDivElement>(null)

  const [{ isOver }, drop] = useDrop(() => ({
    accept: DND_TYPES.STEP_ITEM,
    drop: () => {
      console.log('hit the drop')
      if (!isEqual(orderedStepIds, stepIds)) {
        if (
          confirm(
            'Are you sure you want to reorder these steps, it may cause errors?'
          )
        ) {
          reorderSteps(stepIds)
        }
      }
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }))

  const moveStep = (dragIndex: number, hoverIndex: number): void => {
    const updatedStepIds = [...stepIds]
    const draggedStep = updatedStepIds.splice(dragIndex, 1)[0]
    updatedStepIds.splice(hoverIndex, 0, draggedStep)
    setStepIds(updatedStepIds)
  }
  const currentIds = isOver ? stepIds : orderedStepIds

  drop(ref)
  return (
    <div ref={ref}>
      <ContextMenu>
        {({ makeStepOnContextMenu }) =>
          currentIds.map((stepId: StepIdType, index: number) => (
            <DragDropStepItem
              key={stepId}
              stepNumber={index + 1}
              stepId={stepId}
              index={index}
              onStepContextMenu={() => makeStepOnContextMenu(stepId)}
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
