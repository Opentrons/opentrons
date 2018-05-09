// @flow
import * as React from 'react'
import isNil from 'lodash/isNil'
import {SidePanel, TitledList} from '@opentrons/components'

import {END_STEP} from '../../steplist/types'
import type {StepItemsWithSubsteps, SubstepIdentifier} from '../../steplist/types'
import type {StepIdType} from '../../form-types'
import type {LabwareData} from '../../step-generation'

import StepItem from './StepItem'
import StepCreationButton from '../../containers/StepCreationButton'
import {SubstepItems, generateHeaders} from './substeps'
import styles from './StepItem.css'

type StepIdTypeWithEnd = StepIdType | typeof END_STEP

type StepListProps = {
  errorStepId: ?StepIdType, // this is the first step with an error
  selectedStepId: StepIdTypeWithEnd | null,
  hoveredSubstep: SubstepIdentifier,
  steps: Array<StepItemsWithSubsteps>,
  labware: {[labwareId: string]: LabwareData},
  handleSubstepHover: SubstepIdentifier => mixed,
  handleStepItemClickById?: (StepIdTypeWithEnd) => (event?: SyntheticEvent<>) => mixed,
  handleStepItemCollapseToggleById?: (StepIdType) => (event?: SyntheticEvent<>) => mixed,
  handleStepHoverById?: (StepIdTypeWithEnd | null) => (event?: SyntheticEvent<>) => mixed,
}

export default function StepList (props: StepListProps) {
  return (
    <SidePanel
      title='Protocol Step List'
      onMouseLeave={props.handleStepHoverById && props.handleStepHoverById(null)}
    >
      {props.steps && props.steps.map((step: StepItemsWithSubsteps, key) => (
        <StepItem key={key}
          {...step}
          headers={generateHeaders(step, props.labware)}
          error={(props.errorStepId && step.id)
            ? (step.id >= props.errorStepId)
            : false
          }
          onClick={props.handleStepItemClickById && props.handleStepItemClickById(step.id)}
          onMouseEnter={props.handleStepHoverById && props.handleStepHoverById(step.id)}
          onCollapseToggle={
            (step.stepType === 'deck-setup' || !props.handleStepItemCollapseToggleById)
              ? undefined // Deck Setup steps are not collapsible
              : props.handleStepItemCollapseToggleById(step.id)
          }
          selected={
            props.hoveredSubstep === null && // don't show selected border on the Step when there's a Substep being hovered
            !isNil(props.selectedStepId) && step.id === props.selectedStepId
          }
        >
          <SubstepItems
            substeps={step.substeps}
            onSelectSubstep={props.handleSubstepHover}
            hoveredSubstep={props.hoveredSubstep}
          />
        </StepItem>
      ))}

      <StepCreationButton />
      <TitledList title='END' iconName='check'
        className={styles.step_item}
        onClick={props.handleStepItemClickById && props.handleStepItemClickById(END_STEP)}
        onMouseEnter={props.handleStepHoverById && props.handleStepHoverById(END_STEP)}
        selected={props.selectedStepId === END_STEP}
      />
    </SidePanel>
  )
}
