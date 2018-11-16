// @flow
import * as React from 'react'
import {SidePanel} from '@opentrons/components'
import { DragSource, DropTarget } from 'react-dnd'

import StartingDeckStateTerminalItem from './StartingDeckStateTerminalItem'
import StepItem from '../../containers/ConnectedStepItem'
import StepCreationButton from '../../containers/StepCreationButton'
import TerminalItem from './TerminalItem'
import {END_TERMINAL_TITLE} from '../../constants'
import {END_TERMINAL_ITEM_ID} from '../../steplist'

import type {StepIdType} from '../../form-types'
import {PortalRoot} from './TooltipPortal'

type Props = {
  orderedSteps: Array<StepIdType>,
  reorderSelectedStep: (delta: number) => mixed,
}

const DragSourceStepItem = (props) => (
  props.connectDragSource(
    props.connectDropTarget(
      <div style={{opacity: props.isDragging ? 0.5 : 1}}>
        <StepItem {...props} />
      </div>
    )
  )
)

const DND_TYPES: {STEP_ITEM: "STEP_ITEM"} = {
  STEP_ITEM: 'STEP_ITEM',
}

const stepItemTarget = {
  canDrop: () => {
    return false
  },
  hover: (props: CardProps, monitor: DropTargetMonitor) => {
    const { stepId: draggedId } = monitor.getItem()
    const { stepId: overId } = props

    console.log('step item ', monitor.getItem(), props)
    if (draggedId !== overId) {
      const overIndex = props.findStepIndex(overId)
      props.moveStep(draggedId, overIndex)
    }
  },
}

const specImplementation = {
  beginDrag (props) {
    return {stepId: props.stepId}
  },
}
function collect (connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  }
}
const DraggableStepItem = DragSource(DND_TYPES.STEP_ITEM, specImplementation, collect)(DragSourceStepItem)
const DragDropStepItem = DropTarget(
  DND_TYPES.STEP_ITEM,
  stepItemTarget,
  connect => ({
    connectDropTarget: connect.dropTarget(),
  }),
)(DraggableStepItem)

const stepListTarget = {
  drop (props, monitor, component) {
    // console.log('drop handled ', props, monitor, component)
  },
  hover (props, monitor, component) {
    // console.log('hover handled ', props, monitor, component)
  },
}
function collectTarget (connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
  }
}

type StepItemsProps = {orderedSteps: Array<StepIdType>}
type StepItemsState = {stepIds: Array<StepIdType>}
class StepItems extends React.Component<StepItemsProps, StepItemsState> {
  constructor (props) {
    super(props)
    this.state = {stepIds: this.props.orderedSteps}
  }

  moveStep = (stepId: StepIdType, targetIndex: number) => {
    const {stepIds} = this.state
    const currentIndex = this.findStepIndex(stepId)
    stepIds.splice(currentIndex, 1)
    stepIds.splice(targetIndex, 0, stepId)
    this.setState({stepIds})
  }

  findStepIndex = stepId => (
    this.state.stepIds.findIndex(id => stepId === id)
  )

  render () {
    return this.props.connectDropTarget(
      <div>
        {this.state.stepIds.map((stepId: StepIdType) => (
          <DragDropStepItem
            key={stepId}
            stepId={stepId}
            findStepIndex={this.findStepIndex}
            moveStep={this.moveStep} />
        ))}
      </div>
    )
  }
}

const DroppableStepItems = DropTarget(DND_TYPES.STEP_ITEM, stepListTarget, collectTarget)(StepItems)

export default class StepList extends React.Component<Props> {
  handleKeyDown = (e: SyntheticKeyboardEvent<*>) => {
    const {reorderSelectedStep} = this.props
    const key = e.key
    const altIsPressed = e.getModifierState('Alt')

    if (altIsPressed) {
      if (key === 'ArrowUp') {
        reorderSelectedStep(-1)
      } else if (key === 'ArrowDown') {
        reorderSelectedStep(1)
      }
    }
  }

  componentDidMount () {
    global.addEventListener('keydown', this.handleKeyDown, false)
  }

  componentWillUnmount () {
    global.removeEventListener('keydown', this.handleKeyDown, false)
  }

  render () {
    return (
      <React.Fragment>
        <SidePanel
          title='Protocol Timeline'>
          <StartingDeckStateTerminalItem />
          <DroppableStepItems orderedSteps={this.props.orderedSteps} />
          <StepCreationButton />
          <TerminalItem id={END_TERMINAL_ITEM_ID} title={END_TERMINAL_TITLE} />
        </SidePanel>
        <PortalRoot />
      </React.Fragment>
    )
  }
}
