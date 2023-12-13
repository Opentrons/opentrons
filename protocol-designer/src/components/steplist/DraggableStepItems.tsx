import * as React from 'react'
import { connect } from 'react-redux'
import {
  DragSource,
  DropTarget,
  DragLayer,
  DragLayerMonitor,
  DragSourceConnector,
  DragSourceMonitor,
  DropTargetConnector,
  DropTargetMonitor,
  DragElementWrapper,
  DragSourceOptions,
  ConnectDropTarget,
} from 'react-dnd'
import isEqual from 'lodash/isEqual'

import { DND_TYPES } from '../../constants'
import { ConnectedStepItem } from '../../containers/ConnectedStepItem'
import { PDTitledList } from '../lists'
import { stepIconsByType, StepIdType, StepType } from '../../form-types'
import { selectors as stepFormSelectors } from '../../step-forms'
import { BaseState } from '../../types'
import { ContextMenu } from './ContextMenu'
import styles from './StepItem.module.css'

type DragDropStepItemProps = React.ComponentProps<typeof ConnectedStepItem> & {
  connectDragSource: (val: unknown) => React.ReactElement<any>
  connectDropTarget: (val: unknown) => React.ReactElement<any>
  stepId: StepIdType
  stepNumber: number
  isDragging: boolean
  findStepIndex: (stepIdType: StepIdType) => number
  onDrag: () => void
  moveStep: (stepId: StepIdType, value: number) => void
}

const DragSourceStepItem = (props: DragDropStepItemProps): any =>
  props.connectDragSource(
    props.connectDropTarget(
      <div style={{ opacity: props.isDragging ? 0.3 : 1 }}>
        <ConnectedStepItem {...props} />
      </div>
    )
  )

const stepItemSource = {
  beginDrag: (props: DragDropStepItemProps) => {
    props.onDrag()
    return { stepId: props.stepId }
  },
}
const collectStepSource = (
  connect: DragSourceConnector,
  monitor: DragSourceMonitor
): {
  connectDragSource: DragElementWrapper<DragSourceOptions>
  isDragging: boolean
} => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
})
const DraggableStepItem = DragSource(
  DND_TYPES.STEP_ITEM,
  stepItemSource,
  collectStepSource
)(DragSourceStepItem)

const stepItemTarget = {
  canDrop: () => {
    return false
  },
  hover: (props: DragDropStepItemProps, monitor: DropTargetMonitor) => {
    const { stepId: draggedId } = monitor.getItem()
    const { stepId: overId } = props

    if (draggedId !== overId) {
      const overIndex = props.findStepIndex(overId)
      props.moveStep(draggedId, overIndex)
    }
  },
}
const collectStepTarget = (
  connect: DropTargetConnector
): { connectDropTarget: ReturnType<typeof connect.dropTarget> } => ({
  connectDropTarget: connect.dropTarget(),
})
const DragDropStepItem = DropTarget(
  DND_TYPES.STEP_ITEM,
  stepItemTarget,
  collectStepTarget
)(DraggableStepItem)

interface StepItemsProps {
  orderedStepIds: StepIdType[]
  reorderSteps: (steps: StepIdType[]) => unknown
  isOver: boolean
  connectDropTarget: (val: unknown) => React.ReactElement<any>
}
interface StepItemsState {
  stepIds: StepIdType[]
}
class StepItems extends React.Component<StepItemsProps, StepItemsState> {
  constructor(props: StepItemsProps) {
    super(props)
    this.state = { stepIds: this.props.orderedStepIds }
  }

  onDrag = (): void => {
    this.setState({ stepIds: this.props.orderedStepIds })
  }

  submitReordering = (): void => {
    if (
      confirm(
        'Are you sure you want to reorder these steps, it may cause errors?'
      )
    ) {
      this.props.reorderSteps(this.state.stepIds)
    }
  }

  // TODO: BC 2018-11-27 make util function for reordering and use it in hotkey implementation too
  moveStep = (stepId: StepIdType, targetIndex: number): void => {
    const { stepIds } = this.state
    const currentIndex = this.findStepIndex(stepId)
    const currentRemoved = [
      ...stepIds.slice(0, currentIndex),
      ...stepIds.slice(currentIndex + 1, stepIds.length),
    ]
    const currentReinserted = [
      ...currentRemoved.slice(0, targetIndex),
      stepId,
      ...currentRemoved.slice(targetIndex, currentRemoved.length),
    ]
    this.setState({ stepIds: currentReinserted })
  }

  findStepIndex = (stepId: StepIdType): number =>
    this.state.stepIds.findIndex(id => stepId === id)

  render(): React.ReactNode {
    const currentIds = this.props.isOver
      ? this.state.stepIds
      : this.props.orderedStepIds
    return this.props.connectDropTarget(
      <div>
        <ContextMenu>
          {({ makeStepOnContextMenu }) =>
            currentIds.map((stepId: StepIdType, index: number) => (
              <DragDropStepItem
                key={stepId}
                stepNumber={index + 1}
                stepId={stepId}
                // @ts-expect-error(sa, 2021-6-21): fix when updating react dnd to hooks api
                onStepContextMenu={makeStepOnContextMenu(stepId)}
                findStepIndex={this.findStepIndex}
                onDrag={this.onDrag}
                moveStep={this.moveStep}
              />
            ))
          }
        </ContextMenu>
        <StepDragPreviewLayer />
      </div>
    )
  }
}

const NAV_OFFSET = 64

interface StepDragPreviewSP {
  stepType: StepType | null | undefined
  stepName: string | null | undefined
}

interface StepDragPreviewOP {
  currentOffset?: { y: number; x: number }
  itemType: string
  isDragging: boolean
  item: { stepId: StepIdType }
}

type StepDragPreviewProps = StepDragPreviewOP & StepDragPreviewSP
type DraggableStepItemProps = Omit<
  StepItemsProps,
  'isOver' | 'connectDropTarget'
>

const StepDragPreview = (props: StepDragPreviewProps): JSX.Element | null => {
  const { itemType, isDragging, currentOffset, stepType, stepName } = props
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

const mapSTPForPreview = (
  state: BaseState,
  ownProps: StepDragPreviewProps
): StepDragPreviewSP => {
  const savedForm =
    ownProps.item &&
    stepFormSelectors.getSavedStepForms(state)[ownProps.item.stepId]
  const { stepType, stepName } = savedForm || {}
  return { stepType, stepName }
}

export const StepDragPreviewLayer = DragLayer((monitor: DragLayerMonitor) => ({
  currentOffset: monitor.getSourceClientOffset(),
  isDragging: monitor.isDragging(),
  itemType: monitor.getItemType(),
  item: monitor.getItem(),
}))(connect(mapSTPForPreview)(StepDragPreview))

const listTarget = {
  drop: (
    props: DraggableStepItemProps,
    monitor: DragLayerMonitor,
    component: StepItems
  ) => {
    if (!isEqual(props.orderedStepIds, component.state.stepIds)) {
      component.submitReordering()
    }
  },
}
const collectListTarget = (
  connect: DropTargetConnector,
  monitor: DropTargetMonitor
): { isOver: boolean; connectDropTarget: ConnectDropTarget } => ({
  isOver: monitor.isOver(),
  connectDropTarget: connect.dropTarget(),
})

export const DraggableStepItems = DropTarget<DraggableStepItemProps>(
  DND_TYPES.STEP_ITEM,
  // @ts-expect-error(sa, 2021-6-21): fix when updating react dnd to hooks api
  listTarget,
  collectListTarget
)(StepItems)
