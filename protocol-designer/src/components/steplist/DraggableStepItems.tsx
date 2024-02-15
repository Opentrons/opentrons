import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  DragLayerMonitor,
  useDrop,
  useDrag,
  DropTargetOptions,
  XYCoord,
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
  clickDrop: () => void
  moveStep: (dragIndex: number, value: number) => void
  setIsOver: React.Dispatch<React.SetStateAction<boolean>>
  index: number
}

interface DropType {
  stepId: StepIdType
  index: number
}

const DragDropStepItem = (props: DragDropStepItemProps): JSX.Element => {
  const { stepId, moveStep, clickDrop, setIsOver, index } = props
  const ref = React.useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag({
    type: DND_TYPES.STEP_ITEM,
    item: { stepId, index },
    collect: (monitor: DragLayerMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ isOver, handlerId }, drop] = useDrop(() => ({
    accept: DND_TYPES.STEP_ITEM,
    canDrop: () => {
      return true
    },
    drop: () => {
      clickDrop()
    },
    hover(item: DropType, monitor: DropTargetOptions) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      if (dragIndex === hoverIndex) {
        return
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }
      moveStep(dragIndex, hoverIndex)

      item.index = hoverIndex
    },
    collect: (monitor: DropTargetOptions) => ({
      isOver: monitor.isOver(),
      handlerId: monitor.getHandlerId(),
    }),
  }))

  React.useEffect(() => {
    setIsOver(isOver)
  }, [isOver])

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
  const [isOver, setIsOver] = React.useState<boolean>(false)
  const [stepIds, setStepIds] = React.useState<StepIdType[]>(orderedStepIds)
  React.useEffect(() => {
    setStepIds(orderedStepIds)
  }, [orderedStepIds])

  const clickDrop = (): void => {
    if (!isEqual(orderedStepIds, stepIds)) {
      if (confirm(t('confirm_reorder'))) {
        reorderSteps(stepIds)
      }
    }
  }

  const moveStep = React.useCallback(
    (dragIndex: number, hoverIndex: number) => {
      setStepIds((prevCards: StepIdType[]) => {
        const updatedCards = [...prevCards]
        const draggedCard = updatedCards[dragIndex]
        updatedCards.splice(dragIndex, 1)
        updatedCards.splice(hoverIndex, 0, draggedCard)
        return updatedCards
      })
    },
    []
  )

  const currentIds = isOver ? stepIds : orderedStepIds

  return (
    <>
      <ContextMenu>
        {({ makeStepOnContextMenu }) =>
          currentIds.map((stepId: StepIdType, index: number) => (
            <DragDropStepItem
              key={`${stepId}_${index}`}
              stepNumber={index + 1}
              stepId={stepId}
              //  @ts-expect-error
              onStepContextMenu={makeStepOnContextMenu(stepId)}
              moveStep={moveStep}
              clickDrop={clickDrop}
              setIsOver={setIsOver}
              index={index}
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
