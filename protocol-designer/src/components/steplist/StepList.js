// @flow
import * as React from 'react'
import {SidePanel} from '@opentrons/components'

import StepItem from '../../containers/ConnectedStepItem'
import StepCreationButton from '../../containers/StepCreationButton'
import TerminalItem from './TerminalItem'
import {START_TERMINAL_TITLE, END_TERMINAL_TITLE} from '../../constants'
import {START_TERMINAL_ID, END_TERMINAL_ID} from '../../steplist'

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
      <TerminalItem id={START_TERMINAL_ID} title={START_TERMINAL_TITLE}>
        Blah blah stuff
      </TerminalItem>

      {props.orderedSteps.map((stepId: StepIdType) => (
        <StepItem key={stepId} stepId={stepId} />
      ))}

      <StepCreationButton />
      <TerminalItem id={END_TERMINAL_ID} title={END_TERMINAL_TITLE} />
    </SidePanel>
  )
}
