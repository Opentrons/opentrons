// @flow
import * as React from 'react'
import { SidePanel } from '@opentrons/components'

import StartingDeckStateTerminalItem from './StartingDeckStateTerminalItem'
import TerminalItem from './TerminalItem'
import { END_TERMINAL_TITLE } from '../../constants'
import { END_TERMINAL_ITEM_ID } from '../../steplist'

import StepCreationButton from '../StepCreationButton'
import type { StepIdType } from '../../form-types'
import { PortalRoot } from './TooltipPortal'
import DraggableStepItems from './DraggableStepItems'

type Props = {
  orderedStepIds: Array<StepIdType>,
  reorderSelectedStep: (delta: number) => mixed,
  reorderSteps: (Array<StepIdType>) => mixed,
}

export default class StepList extends React.Component<Props> {
  handleKeyDown = (e: SyntheticKeyboardEvent<*>) => {
    const { reorderSelectedStep } = this.props
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

  componentDidMount() {
    global.addEventListener('keydown', this.handleKeyDown, false)
  }

  componentWillUnmount() {
    global.removeEventListener('keydown', this.handleKeyDown, false)
  }

  render() {
    return (
      <React.Fragment>
        <SidePanel title="Protocol Timeline">
          <StartingDeckStateTerminalItem />
          <DraggableStepItems
            orderedStepIds={this.props.orderedStepIds.slice()}
            reorderSteps={this.props.reorderSteps}
          />
          <StepCreationButton />
          <TerminalItem id={END_TERMINAL_ITEM_ID} title={END_TERMINAL_TITLE} />
        </SidePanel>
        <PortalRoot />
      </React.Fragment>
    )
  }
}
