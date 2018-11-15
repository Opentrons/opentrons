// @flow
import * as React from 'react'
import {SidePanel} from '@opentrons/components'
import { DragSource } from 'react-dnd';

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
    <div style={{opacity: props.isDragging ? 0.5 : 1}}>
      <StepItem {...props} />
    </div>
  )
)

const DND_TYPES: {STEP_ITEM: "STEP_ITEM"} = {
  STEP_ITEM: 'STEP_ITEM',
}
const specImplementation = {
  beginDrag (props) {
    console.log('began')
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
    const {orderedSteps} = this.props

    const stepItems = orderedSteps.map((stepId: StepIdType) =>
      <DraggableStepItem key={stepId} stepId={stepId} />)

    return (
      <React.Fragment>
        <SidePanel
          title='Protocol Timeline'>
          <StartingDeckStateTerminalItem />
          {stepItems}
          <StepCreationButton />
          <TerminalItem id={END_TERMINAL_ITEM_ID} title={END_TERMINAL_TITLE} />
        </SidePanel>
        <PortalRoot />
      </React.Fragment>
    )
  }
}
