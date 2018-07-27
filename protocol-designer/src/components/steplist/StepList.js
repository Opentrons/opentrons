// @flow
import * as React from 'react'
import {SidePanel} from '@opentrons/components'

import StepItem from '../../containers/ConnectedStepItem'
import StepCreationButton from '../../containers/StepCreationButton'
import DeckSetupStepItem from './DeckSetupStepItem'
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
      <DeckSetupStepItem />
      {props.orderedSteps.map((stepId: StepIdType) => (
        <StepItem key={stepId} stepId={stepId} />
      ))}

      <StepCreationButton />

      {/* TODO IMMEDIATELY create EndSetStepItem leaf & put it here instead of using END_STEP */}
      {/* <StepItem stepId={END_STEP} /> */}
    </SidePanel>
  )
}
