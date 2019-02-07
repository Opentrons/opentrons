// @flow
import * as React from 'react'

import {PDTitledList} from '../lists'
import SourceDestSubstep from './SourceDestSubstep'
import styles from './StepItem.css'
import AspirateDispenseHeader from './AspirateDispenseHeader'
import MixHeader from './MixHeader'
import PauseStepItems from './PauseStepItems'
import StepDescription from '../StepDescription'
import {stepIconsByType} from '../../form-types'
import type {FormData, StepIdType, StepType} from '../../form-types'
import type {Labware} from '../../labware-ingred/types'
import type {
  SubstepIdentifier,
  SubstepItemData,
  WellIngredientNames,
} from '../../steplist/types'

type StepItemProps = {
  stepId: StepIdType,
  stepNumber: number,
  stepType: StepType,
  title: string,
  description: ?string,
  substeps: ?SubstepItemData,
  rawForm: ?FormData,

  collapsed?: boolean,
  error?: ?boolean,
  selected?: boolean,
  hovered?: boolean,
  hoveredSubstep: ?SubstepIdentifier,
  ingredNames: WellIngredientNames,

  labwareById: {[labwareId: string]: ?Labware},
  highlightSubstep: SubstepIdentifier => mixed,
  selectStep: (stepId: StepIdType) => mixed,
  onStepContextMenu?: (event?: SyntheticEvent<>) => mixed,
  toggleStepCollapsed: (stepId: StepIdType) => mixed,
  highlightStep: (stepId: StepIdType) => mixed,
  unhighlightStep?: (event?: SyntheticEvent<>) => mixed,
}

class StepItem extends React.PureComponent<StepItemProps> {
  render () {
    const {
      stepType,
      title,
      description,
      stepId,
      stepNumber,

      collapsed,
      error,
      selected,
      hovered,

      unhighlightStep,
      selectStep,
      onStepContextMenu,
      toggleStepCollapsed,
      highlightStep,
    } = this.props

    const iconName = stepIconsByType[stepType]
    const Description = <StepDescription description={description} />

    return (
      <PDTitledList
        description={Description}
        iconName={error ? 'alert-circle' : iconName}
        iconProps={{className: error ? styles.error_icon : ''}}
        title={title ? `${stepNumber}. ${title}` : ''}
        onClick={() => selectStep(stepId)}
        onContextMenu={onStepContextMenu}
        onMouseEnter={() => highlightStep(stepId)}
        onMouseLeave={unhighlightStep}
        onCollapseToggle={() => toggleStepCollapsed(stepId)}
        {...{selected, collapsed, hovered}}
      >
        {getStepItemContents(this.props)}
      </PDTitledList>
    )
  }
}

function getStepItemContents (stepItemProps: StepItemProps) {
  const {
    rawForm,
    stepType,
    substeps,
    labwareById,
    hoveredSubstep,
    highlightSubstep,
    ingredNames,
  } = stepItemProps

  if (!rawForm) {
    return null
  }

  const getLabware = (labwareId: ?string) =>
    labwareId != null ? labwareById[labwareId] : null

  // pause substep component uses the delay args directly
  if (substeps && substeps.commandCreatorFnName === 'delay') {
    return <PauseStepItems pauseArgs={substeps} />
  }

  const result = []

  // headers
  if (stepType === 'moveLiquid') {
    const sourceLabware = getLabware(rawForm['aspirate_labware'])
    const destLabware = getLabware(rawForm['dispense_labware'])

    result.push(<AspirateDispenseHeader key='moveLiquid-header' {...{sourceLabware, destLabware}} />)
  }

  if (stepType === 'mix') {
    result.push(
      <MixHeader key='mix-header'
        volume={rawForm.volume}
        times={rawForm.times}
        labware={getLabware(rawForm.labware)}
      />
    )
  }

  // non-header substeps
  if (
    substeps && (
      substeps.commandCreatorFnName === 'transfer' ||
      substeps.commandCreatorFnName === 'consolidate' ||
      substeps.commandCreatorFnName === 'distribute' ||
      substeps.commandCreatorFnName === 'mix'
    )
  ) {
    result.push(
      <SourceDestSubstep
        key='substeps'
        ingredNames={ingredNames}
        substeps={substeps}
        hoveredSubstep={hoveredSubstep}
        selectSubstep={highlightSubstep}
      />
    )
  }

  return result
}

export default StepItem
