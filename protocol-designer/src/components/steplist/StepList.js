// @flow
import * as React from 'react'
import {SidePanel} from '@opentrons/components'

import {END_STEP, type StepIdTypeWithEnd} from '../../steplist/types'
import type {StepIdType} from '../../form-types'

import StepItem from '../../containers/ConnectedStepItem' // TODO IMMEDIATELY move into StepList/ dir
import StepCreationButton from '../../containers/StepCreationButton'

type StepListProps = {
  orderedSteps: Array<StepIdType>,
  handleStepHoverById?: ?StepIdTypeWithEnd => (event?: SyntheticEvent<>) => mixed
}

export default function StepList (props: StepListProps) {
  return (
    <SidePanel
      title='Protocol Step List'
      onMouseLeave={props.handleStepHoverById && props.handleStepHoverById(null)}
    >
      {props.orderedSteps.map((stepId: StepIdType) => (
        <StepItem key={stepId} stepId={stepId} />
      ))}

      <StepCreationButton />
      <StepItem stepId={END_STEP} />
      {/* TODO IMMEDIATELY remove this */}
      {/* <TitledList title='END' iconName='check'
        className={styles.step_item}
        onClick={props.handleStepItemClickById && props.handleStepItemClickById(END_STEP)}
        onMouseEnter={props.handleStepHoverById && props.handleStepHoverById(END_STEP)}
        selected={props.selectedStepId === END_STEP}
      /> */}
    </SidePanel>
  )
}
