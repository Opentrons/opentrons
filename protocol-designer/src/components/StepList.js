// @flow
import * as React from 'react'
import isNil from 'lodash/isNil'
import pick from 'lodash/pick'
import {SidePanel, TitledList} from '@opentrons/components'

import {END_STEP} from '../steplist/types'
import type {StepItemsWithSubsteps, SubstepIdentifier} from '../steplist/types'
import type {StepIdType} from '../form-types'

import StepItem from '../components/StepItem'
import TransferLikeSubstep from '../components/TransferLikeSubstep'
import StepCreationButton from '../containers/StepCreationButton'

type StepIdTypeWithEnd = StepIdType | typeof END_STEP

type StepListProps = {
  errorStepId: ?StepIdType, // this is the first step with an error
  selectedStepId: StepIdTypeWithEnd | null,
  hoveredSubstep: SubstepIdentifier,
  steps: Array<StepItemsWithSubsteps>,
  handleSubstepHover: SubstepIdentifier => mixed,
  handleStepItemClickById?: (StepIdTypeWithEnd) => (event?: SyntheticEvent<>) => mixed,
  handleStepItemCollapseToggleById?: (StepIdType) => (event?: SyntheticEvent<>) => mixed,
  handleStepHoverById?: (StepIdTypeWithEnd | null) => (event?: SyntheticEvent<>) => mixed,
}

function generateSubstepItems (substeps, onSelectSubstep, hoveredSubstep) {
  if (!substeps) {
    // no substeps, form is probably not finished (or it's "deck-setup" stepType)
    return null
  }

  if (substeps.stepType === 'transfer' ||
    substeps.stepType === 'consolidate' ||
    substeps.stepType === 'distribute'
  ) {
    // all these step types share the same substep display
    return <TransferLikeSubstep
      substeps={substeps}
      hoveredSubstep={hoveredSubstep}
      onSelectSubstep={onSelectSubstep} // TODO use action
    />
  }

  if (substeps.stepType === 'pause') {
    if (substeps.wait === true) {
      // Show message if waiting indefinitely
      return <li>{substeps.message}</li>
    }
    if (!substeps.meta) {
      // No message or time, show nothing
      return null
    }
    const {hours, minutes, seconds} = substeps.meta
    return <li>{hours} hr {minutes} m {seconds} s</li>
  }

  return <li>TODO: substeps for {substeps.stepType}</li>
}

export default function StepList (props: StepListProps) {
  return (
    <SidePanel
      title='Protocol Step List'
      onMouseLeave={props.handleStepHoverById && props.handleStepHoverById(null)}
    >
      {props.steps && props.steps.map((step, key) => (
        <StepItem key={key}
          error={(props.errorStepId && step.id)
            ? (step.id >= props.errorStepId)
            : false
          }
          onClick={props.handleStepItemClickById && props.handleStepItemClickById(step.id)}
          onMouseEnter={props.handleStepHoverById && props.handleStepHoverById(step.id)}
          onCollapseToggle={
            (step.stepType === 'deck-setup' || !props.handleStepItemCollapseToggleById)
              ? null // Deck Setup steps are not collapsible
              : props.handleStepItemCollapseToggleById(step.id)
          }
          selected={
            props.hoveredSubstep === null && // don't show selected border on the Step when there's a Substep being hovered
            !isNil(props.selectedStepId) && step.id === props.selectedStepId
          }
          {...pick(step, [
            'title',
            'stepType',
            'sourceLabwareName',
            'sourceWell',
            'destLabwareName',
            'destWell',
            'description',
            'collapsed'
          ])}
        >
          {generateSubstepItems(step.substeps, props.handleSubstepHover, props.hoveredSubstep)}
        </StepItem>
      ))}

      <StepCreationButton />
      <TitledList title='END' iconName='check'
        onClick={props.handleStepItemClickById && props.handleStepItemClickById(END_STEP)}
        onMouseEnter={props.handleStepHoverById && props.handleStepHoverById(END_STEP)}
        selected={props.selectedStepId === END_STEP}
      />
    </SidePanel>
  )
}
