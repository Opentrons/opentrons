// @flow
import isEqual from 'lodash/isEqual'
import * as React from 'react'
import { DragLayer, DragSource, DropTarget } from 'react-dnd'
import { connect } from 'react-redux'

import { DND_TYPES } from '../../constants'
import { ConnectedStepItem } from '../../containers/ConnectedStepItem'
import {
  type StepIdType,
  type StepType,
  stepIconsByType,
} from '../../form-types'
import { selectors as stepFormSelectors } from '../../step-forms'
import type { BaseState } from '../../types'
import { PDTitledList } from '../lists'
import { ContextMenu } from './ContextMenu'
import styles from './StepItem.css'

type DragDropStepItemProps = {|
  ...$Exact<React.ElementProps<typeof ConnectedStepItem>>,
  connectDragSource: mixed => React.Element<any>,
  connectDropTarget: mixed => React.Element<any>,
  stepId: StepIdType,
  stepNumber: number,
  isDragging: boolean,
  findStepIndex: StepIdType => number,
  onDrag: () => void,
  moveStep: (StepIdType, number) => void,
|}

const DragSourceStepItem = (props: DragDropStepItemProps) =>
  props.connectDragSource(
    props.connectDropTarget(
      <div style={{ opacity: props.isDragging ? 0.3 : 1 }}>
        {/* $FlowFixMe: (mc, 2019-04-18): connected components have exact props, which makes flow complain here */}
        <ConnectedStepItem {...props} />
      </div>
    )
  )

const stepItemSource = {
  beginDrag: props => {
    props.onDrag()
    return { stepId: props.stepId }
  },
}
const collectStepSource = (connect, monitor) => ({
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
  hover: (props: DragDropStepItemProps, monitor) => {
    const { stepId: draggedId } = monitor.getItem()
    const { stepId: overId } = props

    if (draggedId !== overId) {
      const overIndex = props.findStepIndex(overId)
      props.moveStep(draggedId, overIndex)
    }
  },
}
const collectStepTarget = connect => ({
  connectDropTarget: connect.dropTarget(),
})
const DragDropStepItem = DropTarget(
  DND_TYPES.STEP_ITEM,
  stepItemTarget,
  collectStepTarget
)(DraggableStepItem)

type StepItemsProps = {|
  orderedStepIds: Array<StepIdType>,
  reorderSteps: (Array<StepIdType>) => mixed,
  isOver: boolean,
  connectDropTarget: mixed => React.Element<any>,
|}
type StepItemsState = {| stepIds: Array<StepIdType> |}
class StepItems extends React.Component<StepItemsProps, StepItemsState> {
  constructor(props) {
    super(props)
    this.state = { stepIds: this.props.orderedStepIds }
  }

  onDrag = () => {
    this.setState({ stepIds: this.props.orderedStepIds })
  }

  submitReordering = () => {
    if (
      confirm(
        'Are you sure you want to reorder these steps, it may cause errors?'
      )
    ) {
      this.props.reorderSteps(this.state.stepIds)
    }
  }

  // TODO: BC 2018-11-27 make util function for reordering and use it in hotkey implementation too
  moveStep = (stepId: StepIdType, targetIndex: number) => {
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

  findStepIndex = stepId => this.state.stepIds.findIndex(id => stepId === id)

  render() {
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

type StepDragPreviewSP = {| stepType: ?StepType, stepName: ?string |}

type StepDragPreviewOP = {|
  currentOffset?: { y: number, x: number },
  itemType: string,
  isDragging: boolean,
  item: { stepId: StepIdType },
|}

type StepDragPreviewProps = {| ...StepDragPreviewOP, ...StepDragPreviewSP |}

const StepDragPreview = (props: StepDragPreviewProps) => {
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

export const StepDragPreviewLayer: React.AbstractComponent<{||}> = DragLayer(
  monitor => ({
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
    itemType: monitor.getItemType(),
    item: monitor.getItem(),
  })
)(connect(mapSTPForPreview)(StepDragPreview))

const listTarget = {
  drop: (props, monitor, component) => {
    if (!isEqual(props.orderedStepIds, component.state.stepIds)) {
      component.submitReordering()
    }
  },
}
const collectListTarget = (connect, monitor) => ({
  isOver: monitor.isOver(),
  connectDropTarget: connect.dropTarget(),
})

export const DraggableStepItems: React.AbstractComponent<
  $Diff<StepItemsProps, {| isOver: mixed, connectDropTarget: mixed |}>
> = DropTarget(DND_TYPES.STEP_ITEM, listTarget, collectListTarget)(StepItems)
