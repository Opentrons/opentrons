import * as React from 'react'
import { SidePanel } from '@opentrons/components'

import { PresavedStepItem } from './PresavedStepItem'
import { StartingDeckStateTerminalItem } from './StartingDeckStateTerminalItem'
import { TerminalItem } from './TerminalItem'
import { END_TERMINAL_TITLE } from '../../constants'
import { END_TERMINAL_ITEM_ID } from '../../steplist'

import { StepCreationButton } from '../StepCreationButton'
import { DraggableStepItems } from './DraggableStepItems'
import { MultiSelectToolbar } from './MultiSelectToolbar'

import { StepIdType } from '../../form-types'

export interface StepListProps {
  isMultiSelectMode?: boolean | null
  orderedStepIds: StepIdType[]
  reorderSelectedStep: (delta: number) => unknown
  reorderSteps: (steps: StepIdType[]) => unknown
}

export class StepList extends React.Component<StepListProps> {
  handleKeyDown: (e: KeyboardEvent) => void = e => {
    const { reorderSelectedStep } = this.props
    const key = e.key
    const altIsPressed = e.altKey

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

  componentDidMount(): void {
    global.addEventListener('keydown', this.handleKeyDown, false)
  }

  componentWillUnmount(): void {
    global.removeEventListener('keydown', this.handleKeyDown, false)
  }

  render(): React.ReactNode {
    return (
      <SidePanel title="Protocol Timeline">
        <MultiSelectToolbar
          isMultiSelectMode={Boolean(this.props.isMultiSelectMode)}
        />

        <StartingDeckStateTerminalItem />
        <DraggableStepItems
          orderedStepIds={this.props.orderedStepIds.slice()}
          reorderSteps={this.props.reorderSteps}
        />
        <PresavedStepItem />
        <StepCreationButton />
        <TerminalItem id={END_TERMINAL_ITEM_ID} title={END_TERMINAL_TITLE} />
      </SidePanel>
    )
  }
}
