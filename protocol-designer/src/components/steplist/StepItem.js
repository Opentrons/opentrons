// @flow
import * as React from 'react'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
} from '@opentrons/shared-data'
import { PDTitledList } from '../lists'
import { SourceDestSubstep } from './SourceDestSubstep'
import { AspirateDispenseHeader } from './AspirateDispenseHeader'
import { MixHeader } from './MixHeader'
import { PauseStepItems } from './PauseStepItems'
import { ModuleStepItems } from './ModuleStepItems'
import { StepDescription } from '../StepDescription'
import { stepIconsByType } from '../../form-types'
import { i18n } from '../../localization'
import styles from './StepItem.css'

import type { FormData, StepIdType, StepType } from '../../form-types'
import type {
  SubstepIdentifier,
  SubstepItemData,
  WellIngredientNames,
} from '../../steplist/types'

type CommonProps = {|
  stepId: StepIdType, // TODO IMMEDIATELY don't pass in stepId
  stepNumber: number,
  stepType: StepType,
  title: string,
  description: ?string,
  substeps: ?SubstepItemData,
  rawForm: ?FormData,

  collapsed?: boolean,
  error?: ?boolean,
  warning?: ?boolean,
  selected?: boolean,
  hovered?: boolean,
  ingredNames: WellIngredientNames,

  labwareNicknamesById: { [labwareId: string]: string },
  labwareDefDisplayNamesById: { [labwareId: string]: ?string },
  selectStep: (stepId: StepIdType) => mixed,
  onStepContextMenu?: (event?: SyntheticEvent<>) => mixed,
  toggleStepCollapsed: (stepId: StepIdType) => mixed,
  highlightStep: (stepId: StepIdType) => mixed,
  unhighlightStep: (event?: SyntheticEvent<>) => mixed,
|}

export type StepItemProps =
  | {|
      ...CommonProps,
      isPresavedStep: true,
    |}
  | {|
      ...CommonProps,
      isPresavedStep: false,
      highlightSubstep: SubstepIdentifier => mixed,
      hoveredSubstep: ?SubstepIdentifier,
    |}

export const StepItem = (props: StepItemProps) => {
  const {
    stepType,
    title,
    description,
    stepId,
    stepNumber,

    collapsed,
    error,
    warning,
    selected,
    hovered,

    unhighlightStep,
    selectStep,
    onStepContextMenu,
    toggleStepCollapsed,
    highlightStep,
  } = props

  const iconName = stepIconsByType[stepType]
  let iconClassName = ''
  if (error) {
    iconClassName = styles.error_icon
  } else if (warning) {
    iconClassName = styles.warning_icon
  }
  const Description = <StepDescription description={description} />

  return (
    <PDTitledList
      description={Description}
      iconName={error || warning ? 'alert-circle' : iconName}
      iconProps={{ className: iconClassName }}
      title={title ? `${stepNumber}. ${title}` : ''}
      onClick={() => selectStep(stepId)}
      onContextMenu={onStepContextMenu}
      onMouseEnter={() => highlightStep(stepId)}
      onMouseLeave={unhighlightStep}
      onCollapseToggle={() => toggleStepCollapsed(stepId)}
      {...{ selected, collapsed, hovered }}
    >
      {props.isPresavedStep ? null : <StepItemContents {...props} />}
    </PDTitledList>
  )
}

export type StepItemContentsProps = {|
  isPresavedStep: false,
  stepId: StepIdType, // TODO IMMEDIATELY don't pass in stepId
  stepNumber: number,
  stepType: StepType,
  title: string,
  description: ?string,
  substeps: ?SubstepItemData,
  rawForm: ?FormData,

  collapsed?: boolean,
  error?: ?boolean,
  warning?: ?boolean,
  selected?: boolean,
  hovered?: boolean,
  hoveredSubstep: ?SubstepIdentifier,
  ingredNames: WellIngredientNames,

  labwareNicknamesById: { [labwareId: string]: string },
  labwareDefDisplayNamesById: { [labwareId: string]: ?string },
  selectStep: (stepId: StepIdType) => mixed,
  onStepContextMenu?: (event?: SyntheticEvent<>) => mixed,
  toggleStepCollapsed: (stepId: StepIdType) => mixed,
  highlightStep: (stepId: StepIdType) => mixed,
  unhighlightStep: (event?: SyntheticEvent<>) => mixed,
  highlightSubstep: SubstepIdentifier => mixed,
|}

export const StepItemContents = (props: StepItemContentsProps) => {
  const {
    rawForm,
    stepType,
    substeps,
    labwareNicknamesById,
    labwareDefDisplayNamesById,
    hoveredSubstep,
    highlightSubstep,
    ingredNames,
  } = props

  if (!rawForm) {
    return null
  }

  // pause substep component uses the delay args directly
  if (substeps && substeps.substepType === 'pause') {
    return <PauseStepItems pauseArgs={substeps.pauseStepArgs} />
  }

  if (substeps && substeps.substepType === 'magnet') {
    return (
      <ModuleStepItems
        labwareDisplayName={substeps.labwareDisplayName}
        labwareNickname={substeps.labwareNickname}
        message={substeps.message}
        action={i18n.t(`modules.actions.action`)}
        actionText={i18n.t(
          `modules.actions.${substeps.engage ? 'engage' : 'disengage'}`
        )}
        moduleType={MAGNETIC_MODULE_TYPE}
      />
    )
  }

  if (substeps && substeps.substepType === 'temperature') {
    const temperature =
      substeps.temperature === null
        ? 'Deactivated'
        : `${substeps.temperature} ${i18n.t('application.units.degrees')}`

    return (
      <ModuleStepItems
        labwareDisplayName={substeps.labwareDisplayName}
        labwareNickname={substeps.labwareNickname}
        message={substeps.message}
        action={i18n.t(`modules.actions.go_to`)}
        actionText={temperature}
        moduleType={TEMPERATURE_MODULE_TYPE}
      />
    )
  }

  if (substeps && substeps.substepType === 'awaitTemperature') {
    const temperature = `${substeps.temperature} ${i18n.t(
      'application.units.degrees'
    )}`

    return (
      <ModuleStepItems
        labwareDisplayName={substeps.labwareDisplayName}
        labwareNickname={substeps.labwareNickname}
        message={substeps.message}
        action={i18n.t('modules.actions.await_temperature')}
        actionText={temperature}
        moduleType={TEMPERATURE_MODULE_TYPE}
      />
    )
  }

  const result = []

  // headers
  if (stepType === 'moveLiquid') {
    const sourceLabwareId = rawForm['aspirate_labware']
    const destLabwareId = rawForm['dispense_labware']

    result.push(
      <AspirateDispenseHeader
        key="moveLiquid-header"
        sourceLabwareNickname={labwareNicknamesById[sourceLabwareId]}
        sourceLabwareDefDisplayName={
          labwareDefDisplayNamesById[sourceLabwareId]
        }
        destLabwareNickname={labwareNicknamesById[destLabwareId]}
        destLabwareDefDisplayName={labwareDefDisplayNamesById[destLabwareId]}
      />
    )
  }

  if (stepType === 'mix') {
    const mixLabwareId = rawForm['labware']
    result.push(
      <MixHeader
        key="mix-header"
        volume={rawForm.volume}
        times={rawForm.times}
        labwareNickname={labwareNicknamesById[mixLabwareId]}
        labwareDefDisplayName={labwareDefDisplayNamesById[mixLabwareId]}
      />
    )
  }

  // non-header substeps
  if (
    substeps &&
    (substeps.commandCreatorFnName === 'transfer' ||
      substeps.commandCreatorFnName === 'consolidate' ||
      substeps.commandCreatorFnName === 'distribute' ||
      substeps.commandCreatorFnName === 'mix')
  ) {
    result.push(
      <SourceDestSubstep
        key="substeps"
        ingredNames={ingredNames}
        substeps={substeps}
        hoveredSubstep={hoveredSubstep}
        selectSubstep={highlightSubstep}
      />
    )
  }

  return result
}
