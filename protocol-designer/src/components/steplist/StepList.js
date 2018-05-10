// @flow
import * as React from 'react'
import {SidePanel} from '@opentrons/components'

import {END_STEP} from '../../steplist/types'
import type {StepIdType} from '../../form-types'

import StepItem from '../../containers/ConnectedStepItem' // TODO IMMEDIATELY move into StepList/ dir
import StepCreationButton from '../../containers/StepCreationButton'
// import {SubstepItems, generateHeaders} from './substeps'
// import styles from './StepItem.css'

type StepIdTypeWithEnd = StepIdType | typeof END_STEP // TODO IMMEDIATELY import this

type StepListProps = {
  orderedSteps: Array<StepIdType>,
  handleStepHoverById?: (StepIdTypeWithEnd | null) => (event?: SyntheticEvent<>) => mixed
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
