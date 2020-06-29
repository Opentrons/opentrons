// @flow
import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'

import type { FormData, StepIdType, StepType } from '../../form-types'
import type { FormPatch } from '../../steplist/actions/types'
import { maskField } from '../../steplist/fieldLevel'
import {
  createBlankForm,
  getNextDefaultBlockIsActive,
  getNextDefaultBlockTemperature,
  getNextDefaultEngageHeight,
  getNextDefaultLidIsActive,
  getNextDefaultLidOpen,
  getNextDefaultLidTemperature,
  getNextDefaultMagnetAction,
  getNextDefaultPipetteId,
  getNextDefaultTemperatureModuleId,
  getNextDefaultThermocyclerModuleId,
  handleFormChange,
} from '../../steplist/formLevel'
import {
  getMagnetLabwareEngageHeight,
  getModuleOnDeckByType,
} from '../../ui/modules/utils'
import type { OrderedStepIdsState, SavedStepFormState } from '../reducers'
import type {
  InitialDeckSetup,
  LabwareEntities,
  PipetteEntities,
} from '../types'

export type CreatePresavedStepFormArgs = {|
  stepId: StepIdType,
  stepType: StepType,
  pipetteEntities: PipetteEntities,
  labwareEntities: LabwareEntities,
  savedStepForms: SavedStepFormState,
  orderedStepIds: OrderedStepIdsState,
  initialDeckSetup: InitialDeckSetup,
|}

type FormUpdater = FormData => FormPatch | null

const _patchDefaultPipette = (args: {|
  initialDeckSetup: InitialDeckSetup,
  labwareEntities: LabwareEntities,
  orderedStepIds: OrderedStepIdsState,
  pipetteEntities: PipetteEntities,
  savedStepForms: SavedStepFormState,
|}): FormUpdater => formData => {
  const {
    initialDeckSetup,
    labwareEntities,
    orderedStepIds,
    pipetteEntities,
    savedStepForms,
  } = args

  const defaultPipetteId = getNextDefaultPipetteId(
    savedStepForms,
    orderedStepIds,
    initialDeckSetup.pipettes
  )

  // If there is a `pipette` field in the form,
  // then set `pipette` field of new steps to the next default pipette id.
  //
  // In order to trigger dependent field changes (eg default disposal volume),
  // update the form thru handleFormChange.
  const formHasPipetteField = formData && 'pipette' in formData
  if (formHasPipetteField && defaultPipetteId !== '') {
    const updatedFields = handleFormChange(
      { pipette: defaultPipetteId },
      formData,
      pipetteEntities,
      labwareEntities
    )

    return updatedFields
  }
  return null
}

const _patchDefaultMagnetFields = (args: {|
  initialDeckSetup: InitialDeckSetup,
  orderedStepIds: OrderedStepIdsState,
  savedStepForms: SavedStepFormState,
  stepType: StepType,
|}): FormUpdater => () => {
  const { initialDeckSetup, orderedStepIds, savedStepForms, stepType } = args
  if (stepType !== 'magnet') {
    return null
  }

  const moduleId =
    getModuleOnDeckByType(initialDeckSetup, MAGNETIC_MODULE_TYPE)?.id || null

  const magnetAction = getNextDefaultMagnetAction(
    savedStepForms,
    orderedStepIds
  )

  const defaultEngageHeight = getMagnetLabwareEngageHeight(
    initialDeckSetup,
    moduleId
  )

  const stringDefaultEngageHeight = defaultEngageHeight
    ? maskField('engageHeight', defaultEngageHeight)
    : null

  const prevEngageHeight = getNextDefaultEngageHeight(
    savedStepForms,
    orderedStepIds
  )
  // 'magnet' steps only.
  //
  // if no previously saved engageHeight, autopopulate with recommended value
  // recommended value is null when no labware found on module
  //
  // Bypass dependent field changes, do not use handleFormChange
  const engageHeight = prevEngageHeight || stringDefaultEngageHeight
  return { moduleId, magnetAction, engageHeight }
}

const _patchTemperatureModuleId = (args: {|
  initialDeckSetup: InitialDeckSetup,
  orderedStepIds: OrderedStepIdsState,
  savedStepForms: SavedStepFormState,
  stepType: StepType,
|}): FormUpdater => () => {
  const { initialDeckSetup, orderedStepIds, savedStepForms, stepType } = args

  const hasTemperatureModuleId =
    stepType === 'pause' || stepType === 'temperature'
  // Auto-populate moduleId field of 'pause' and 'temperature' steps.
  //
  // Bypass dependent field changes, do not use handleFormChange
  if (hasTemperatureModuleId) {
    const moduleId = getNextDefaultTemperatureModuleId(
      savedStepForms,
      orderedStepIds,
      initialDeckSetup.modules
    )
    return { moduleId }
  }
  return null
}

const _patchThermocyclerFields = (args: {|
  initialDeckSetup: InitialDeckSetup,
  orderedStepIds: OrderedStepIdsState,
  savedStepForms: SavedStepFormState,
  stepType: StepType,
|}): FormUpdater => () => {
  const { initialDeckSetup, orderedStepIds, savedStepForms, stepType } = args

  if (stepType !== 'thermocycler') {
    return null
  }

  const moduleId = getNextDefaultThermocyclerModuleId(
    savedStepForms,
    orderedStepIds,
    initialDeckSetup.modules
  )

  const blockIsActive = getNextDefaultBlockIsActive(
    savedStepForms,
    orderedStepIds
  )

  const blockTargetTemp = getNextDefaultBlockTemperature(
    savedStepForms,
    orderedStepIds
  )

  const lidIsActive = getNextDefaultLidIsActive(savedStepForms, orderedStepIds)

  const lidTargetTemp = getNextDefaultLidTemperature(
    savedStepForms,
    orderedStepIds
  )

  const lidOpen = getNextDefaultLidOpen(savedStepForms, orderedStepIds)
  return {
    moduleId,
    blockIsActive,
    blockTargetTemp,
    lidIsActive,
    lidTargetTemp,
    lidOpen,
  }
}

export const createPresavedStepForm = ({
  initialDeckSetup,
  labwareEntities,
  orderedStepIds,
  pipetteEntities,
  savedStepForms,
  stepId,
  stepType,
}: CreatePresavedStepFormArgs): FormData => {
  const formData = createBlankForm({
    stepId,
    stepType,
  })

  const updateDefaultPipette = _patchDefaultPipette({
    initialDeckSetup,
    labwareEntities,
    orderedStepIds,
    pipetteEntities,
    savedStepForms,
  })

  const updateMagneticModuleId = _patchDefaultMagnetFields({
    initialDeckSetup,
    orderedStepIds,
    savedStepForms,
    stepType,
  })

  const updateTemperatureModuleId = _patchTemperatureModuleId({
    initialDeckSetup,
    orderedStepIds,
    savedStepForms,
    stepType,
  })

  const updateThermocyclerModuleId = _patchThermocyclerFields({
    initialDeckSetup,
    orderedStepIds,
    savedStepForms,
    stepType,
  })

  // finally, compose and apply all the updaters in order,
  // passing the applied result from one updater as the input of the next
  return [
    updateDefaultPipette,
    updateTemperatureModuleId,
    updateThermocyclerModuleId,
    updateMagneticModuleId,
  ].reduce<FormData>(
    (acc, updater: FormUpdater) => {
      const updates = updater(acc)
      if (updates === null) {
        return acc
      }
      // TODO(IL, 2020-04-30): Flow cannot be sure that spreading FormPatch type will not overwrite
      // values for the explicitly-typed keys in FormData (`stepType: StepType` for example)
      // with `[key]: mixed`.
      // $FlowFixMe - Fix in #3161.
      return { ...acc, ...updates }
    },
    { ...formData }
  )
}
