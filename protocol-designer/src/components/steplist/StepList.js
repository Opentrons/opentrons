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

type StepListProps = {
  orderedSteps: Array<StepIdType>,
  handleStepHoverById?: (?StepIdType) => (event?: SyntheticEvent<>) => mixed
}

export default function StepList (props: StepListProps) {
  return (
    <SidePanel
      title='Protocol Timeline'
      onMouseLeave={props.handleStepHoverById && props.handleStepHoverById(null)}
    >
      <StartingDeckStateTerminalItem />

      {props.orderedSteps.map((stepId: StepIdType) => (
        <StepItem key={stepId} stepId={stepId} />
      ))}

      <StepCreationButton />
      <TerminalItem id={END_TERMINAL_ITEM_ID} title={END_TERMINAL_TITLE} />
    </SidePanel>
  )
}
