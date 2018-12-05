// @flow
import * as React from 'react'
import { DragSource, DropTarget } from 'react-dnd'
import isEqual from 'lodash/isEqual'

import StepItem from '../../containers/ConnectedStepItem'
import type {StepIdType} from '../../form-types'
import ContextMenu from './ContextMenu'

const DND_TYPES: {STEP_ITEM: "STEP_ITEM"} = {
  STEP_ITEM: 'STEP_ITEM',
}

type DragDropStepItemProps = React.ElementProps<typeof StepItem> & {
  connectDragSource: mixed => React.Element<any>,
  connectDropTarget: mixed => React.Element<any>,
  stepId: StepIdType,
  findStepIndex: (StepIdType) => number,
  onDrag: () => void,
  moveStep: (StepIdType, number) => void,
}
const DragSourceStepItem = (props: DragDropStepItemProps) => (
  props.connectDragSource(
    props.connectDropTarget(
      <div style={{opacity: props.isDragging ? 0.3 : 1}}>
        <StepItem {...props} />
      </div>
    )
  )
)

const stepItemSource = {
  beginDrag: (props) => {
    props.onDrag()
    return {stepId: props.stepId}
  },
}
const collectStepSource = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
})
const DraggableStepItem = DragSource(DND_TYPES.STEP_ITEM, stepItemSource, collectStepSource)(DragSourceStepItem)

const stepItemTarget = {
  canDrop: () => { return false },
  hover: (props: DragDropStepItemProps, monitor) => {
    const { stepId: draggedId } = monitor.getItem()
    const { stepId: overId } = props

    if (draggedId !== overId) {
      const overIndex = props.findStepIndex(overId)
      props.moveStep(draggedId, overIndex)
    }
  },
}
const collectStepTarget = (connect) => ({
  connectDropTarget: connect.dropTarget(),
})
const DragDropStepItem = DropTarget(DND_TYPES.STEP_ITEM, stepItemTarget, collectStepTarget)(DraggableStepItem)

type StepItemsProps = {
  orderedSteps: Array<StepIdType>,
  reorderSteps: (Array<StepIdType>) => mixed,
  isOver: boolean,
  connectDropTarget: mixed => React.Element<any>,
}
type StepItemsState = {stepIds: Array<StepIdType>}
class StepItems extends React.Component<StepItemsProps, StepItemsState> {
  constructor (props) {
    super(props)
    this.state = {stepIds: this.props.orderedSteps}
  }

  onDrag = () => {
    this.setState({stepIds: this.props.orderedSteps})
  }

  submitReordering = () => {
    if (confirm('Are you sure you want to reorder these steps, it may cause errors?')) {
      this.props.reorderSteps(this.state.stepIds)
    }
  }

  // TODO: BC 2018-11-27 make util function for reordering and use it in hotkey implementation too
  moveStep = (stepId: StepIdType, targetIndex: number) => {
    const {stepIds} = this.state
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
    this.setState({stepIds: currentReinserted})
  }

  findStepIndex = stepId => (
    this.state.stepIds.findIndex(id => stepId === id)
  )

  render () {
    const currentIds = this.props.isOver ? this.state.stepIds : this.props.orderedSteps
    return this.props.connectDropTarget(
      <div>
        <ContextMenu>
          {({makeStepOnContextMenu}) => (
            currentIds.map((stepId: StepIdType) => (
              <DragDropStepItem
                key={stepId}
                stepId={stepId}
                onStepContextMenu={makeStepOnContextMenu(stepId)}
                findStepIndex={this.findStepIndex}
                onDrag={this.onDrag}
                moveStep={this.moveStep} />
            ))
          )}
        </ContextMenu>
      </div>
    )
  }
}

const listTarget = {
  drop: (props, monitor, component) => {
    if (!isEqual(props.orderedSteps, component.state.stepIds)) {
      component.submitReordering()
    }
  },
}
const collectListTarget = (connect, monitor) => ({
  isOver: monitor.isOver(),
  connectDropTarget: connect.dropTarget(),
})

export default DropTarget(DND_TYPES.STEP_ITEM, listTarget, collectListTarget)(StepItems)
