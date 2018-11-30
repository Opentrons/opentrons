// @flow
import * as React from 'react'
import {SidePanel} from '@opentrons/components'

import StartingDeckStateTerminalItem from './StartingDeckStateTerminalItem'
import StepCreationButton from '../../containers/StepCreationButton'
import TerminalItem from './TerminalItem'
import {END_TERMINAL_TITLE} from '../../constants'
import {END_TERMINAL_ITEM_ID} from '../../steplist'

import type {StepIdType} from '../../form-types'
import {PortalRoot} from './TooltipPortal'
import DraggableStepItems from './DraggableStepItems'

type Props = {
  orderedSteps: Array<StepIdType>,
  reorderSelectedStep: (delta: number) => mixed,
  reorderSteps: (Array<StepIdType>) => mixed,
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
          <DraggableStepItems
            orderedSteps={this.props.orderedSteps.slice()}
            reorderSteps={this.props.reorderSteps} />
          <StepCreationButton />
          <TerminalItem id={END_TERMINAL_ITEM_ID} title={END_TERMINAL_TITLE} />
        </SidePanel>
        <PortalRoot />
      </React.Fragment>
    )
  }
}
