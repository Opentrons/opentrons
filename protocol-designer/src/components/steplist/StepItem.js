// @flow
import * as React from 'react'
import {TitledList} from '@opentrons/components'
import SourceDestSubstep from './SourceDestSubstep'
import styles from './StepItem.css'

import AspirateDispenseHeader from './AspirateDispenseHeader'
import MixHeader from './MixHeader'
import PauseStepItems from './PauseStepItems'
import StepDescription from '../StepDescription'
import {stepIconsByType} from '../../form-types'

import type {SubstepIdentifier, StepItemData, StepSubItemData} from '../../steplist/types'

type StepItemProps = {
  step: ?StepItemData,
  substeps: ?StepSubItemData,

  collapsed?: boolean,
  error?: ?boolean,
  selected?: boolean,
  hoveredSubstep: ?SubstepIdentifier,

  getLabwareName: (labwareId: ?string) => ?string,
  handleSubstepHover: SubstepIdentifier => mixed,
  onStepClick?: (event?: SyntheticEvent<>) => mixed,
  onStepItemCollapseToggle?: (event?: SyntheticEvent<>) => mixed,
  onStepHover?: (event?: SyntheticEvent<>) => mixed,
  onStepMouseLeave?: (event?: SyntheticEvent<>) => mixed,
}

export default function StepItem (props: StepItemProps) {
  const {
    step,
    // substeps,

    collapsed,
    error,
    selected,
    // hoveredSubstep,

    // handleSubstepHover,
    onStepMouseLeave,
    onStepClick,
    onStepItemCollapseToggle,
    onStepHover
  } = props

  const iconName = step && stepIconsByType[step.stepType]

  const Description = <StepDescription description={step && step.description} />

  return (
    <TitledList
      className={styles.step_item}
      description={Description}
      iconName={error ? 'alert-circle' : iconName}
      iconProps={{className: error ? styles.error_icon : ''}}
      title={(step && step.title) || '???'} // TODO IMMEDIATELY do we ever not have a step?
      onClick={onStepClick}
      onMouseEnter={onStepHover}
      onMouseLeave={onStepMouseLeave}
      onCollapseToggle={onStepItemCollapseToggle}
      {...{selected, collapsed}}
    >
      {hackSubstepItemThing(props)}
    </TitledList>
  )
}

function hackSubstepItemThing (stepItemProps: StepItemProps) { // TODO just pass props
  const {
    step,
    substeps,
    getLabwareName,
    hoveredSubstep,
    handleSubstepHover
  } = stepItemProps

  const formData = step && step.formData

  if (!step) {
    return null
  }

  if (substeps && substeps.stepType === 'pause') {
    return <PauseStepItems {...{substeps}} />
  }

  const result = []

  // headers

  if (
    formData && (
      formData.stepType === 'transfer' ||
      formData.stepType === 'consolidate' ||
      formData.stepType === 'distribute'
    )
  ) {
    const sourceLabwareName = getLabwareName(formData['aspirate--labware'])
    const destLabwareName = getLabwareName(formData['dispense--labware'])

    result.push(
      <AspirateDispenseHeader
        key='transferlike-header'
        {...{sourceLabwareName, destLabwareName}}
      />
    )
  }

  if (formData && formData.stepType === 'mix') {
    result.push(
      <MixHeader key='mix-header'
        volume={formData.volume}
        times={formData.times}
        labwareName={getLabwareName(formData.labware)}
      />
    )
  }

  // non-header substeps

  if (
    substeps && (
      substeps.stepType === 'transfer' ||
      substeps.stepType === 'consolidate' ||
      substeps.stepType === 'distribute' ||
      substeps.stepType === 'mix'
    )
  ) {
    result.push(
      <SourceDestSubstep
        key='substeps'
        substeps={substeps}
        hoveredSubstep={hoveredSubstep}
        onSelectSubstep={handleSubstepHover}
      />
    )
  }

  return result
}
