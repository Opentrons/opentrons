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
import ContextMenu from './ContextMenu'

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
      let delta = 0
      if (key === 'ArrowUp') {
        delta = -1
      } else if (key === 'ArrowDown') {
        delta = 1
      }
      if (!delta) return
      reorderSelectedStep(delta)
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

    const stepItems = (
      <ContextMenu>
        {({makeStepOnContextMenu}) => orderedSteps.map((stepId: StepIdType) => (
          <StepItem
            key={stepId}
            onStepContextMenu={makeStepOnContextMenu(stepId)}
            stepId={stepId} />
        ))}
      </ContextMenu>
    )

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
