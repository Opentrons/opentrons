// @flow
import * as React from 'react'
import {SidePanel} from '@opentrons/components'

import StartingDeckStateTerminalItem from './StartingDeckStateTerminalItem'
import StepItem from '../../containers/ConnectedStepItem'
import StepCreationButton from '../../containers/StepCreationButton'
import TerminalItem from './TerminalItem'
import {END_TERMINAL_TITLE} from '../../constants'
import {END_TERMINAL_ITEM_ID} from '../../steplist'

import type {StepIdType} from '../../form-types'
import {PortalRoot} from './TooltipPortal'
import { DropTarget } from 'react-dnd'

type StepItemsProps = {orderedSteps: Array<StepIdType>}
function StepItems (props: StepItemsProps) {
  const {orderedSteps, connectDropTarget} = props
  return connectDropTarget(
    <div>
      {orderedSteps.map((stepId: StepIdType) => <StepItem key={stepId} stepId={stepId} />)}
    </div>
  )
}

const cardTarget = {
  drop (props, monitor, component) {
    console.log('began drop', props, monitor, component)
  },
  hover (props, monitor, component) {
    console.log('began hover', props, monitor, component)
  },
}

function collectTarget (connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
  }
}

const StepItemsDropTarget = DropTarget('STEP_ITEM', cardTarget, collectTarget)(StepItems)

type Props = {
  orderedSteps: Array<StepIdType>,
  reorderSelectedStep: (delta: number) => mixed,
}

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
          <StepItemsDropTarget orderedSteps={this.props.orderedSteps} />
          <StepCreationButton />
          <TerminalItem id={END_TERMINAL_ITEM_ID} title={END_TERMINAL_TITLE} />
        </SidePanel>
        <PortalRoot />
      </React.Fragment>
    )
  }
}

