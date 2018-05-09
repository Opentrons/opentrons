// @flow
import * as React from 'react'
import isNil from 'lodash/isNil'
import cx from 'classnames'
import {SidePanel, TitledList, Icon} from '@opentrons/components'

import {END_STEP} from '../../steplist/types'
import type {StepItemsWithSubsteps, SubstepIdentifier} from '../../steplist/types'
import type {StepIdType} from '../../form-types'
import type {LabwareData} from '../../step-generation'

import StepItem from './StepItem'
import SourceDestSubstep from './SourceDestSubstep'
import StepCreationButton from '../../containers/StepCreationButton'
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

function generateSubstepItems (substeps, onSelectSubstep, hoveredSubstep) {
  if (!substeps) {
    // no substeps, form is probably not finished (or it's "deck-setup" stepType)
    return null
  }

  if (substeps.stepType === 'transfer' ||
    substeps.stepType === 'consolidate' ||
    substeps.stepType === 'distribute' ||
    substeps.stepType === 'mix'
  ) {
    // all these step types share the same substep display
    return <SourceDestSubstep
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

function getLabwareName (labwareId: ?string, labware: {[string]: LabwareData}): ?string {
  return labwareId && labware[labwareId] && labware[labwareId].name
}

function generateHeaders (step: StepItemsWithSubsteps, labware: *) {
  const formData = step.formData
  if (!formData) {
    return
  }

  if (formData.stepType === 'mix') {
    return <li className={styles.step_subitem}>
      <span className={styles.emphasized_cell}>{getLabwareName(formData.labware, labware)}</span>
      <span>{formData.volume} uL</span>
      <span>{formData.times}x</span>
    </li>
  }

  if (
    formData.stepType === 'consolidate' ||
    formData.stepType === 'distribute' ||
    formData.stepType === 'transfer'
  ) {
    const sourceLabwareName = getLabwareName(formData['aspirate--labware'], labware)
    const destLabwareName = getLabwareName(formData['dispense--labware'], labware)
    if (!sourceLabwareName || !destLabwareName) {
      return
    }

    return [
      <li key='header-0' className={styles.aspirate_dispense}>
          <span>ASPIRATE</span>
          <span className={styles.spacer}/>
          <span>DISPENSE</span>
      </li>,

      <li key='header-1' className={cx(styles.step_subitem_column_header, styles.emphasized_cell)}>
        <span>{sourceLabwareName}</span>
        {/* This is always a "transfer icon" (arrow pointing right) for any step: */}
        <Icon name='ot-transfer' />
        <span>{destLabwareName}</span>
      </li>
    ]
  }
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
          {generateSubstepItems(step.substeps, props.handleSubstepHover, props.hoveredSubstep)}
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
