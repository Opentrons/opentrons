// @flow
import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'
import {
  generateNewForm,
  getNextDefaultEngageHeight,
  getNextDefaultMagnetAction,
  getNextDefaultPipetteId,
  getNextDefaultTemperatureModuleId,
  handleFormChange,
} from '../../steplist/formLevel'
import {
  getModuleOnDeckByType,
  getMagnetLabwareEngageHeight,
} from '../../ui/modules/utils'
import { maskField } from '../../steplist/fieldLevel'
import type { FormData, StepType, StepIdType } from '../../form-types'
import type {
  PipetteEntities,
  LabwareEntities,
  InitialDeckSetup,
} from '../types'
import type { SavedStepFormState, OrderedStepIdsState } from '../reducers'

export type CreatePresavedStepFormArgs = {|
  stepId: StepIdType,
  stepType: StepType,
  pipetteEntities: PipetteEntities,
  labwareEntities: LabwareEntities,
  savedStepForms: SavedStepFormState,
  orderedStepIds: OrderedStepIdsState,
  initialDeckSetup: InitialDeckSetup,
|}
export const createPresavedStepForm = ({
  stepId,
  stepType,
  pipetteEntities,
  labwareEntities,
  savedStepForms,
  orderedStepIds,
  initialDeckSetup,
}: CreatePresavedStepFormArgs): FormData => {
  let formData = generateNewForm({
    // TODO IMMEDIATELY this should  be 'default values'
    stepId,
    stepType,
  })

  const defaultPipetteId = getNextDefaultPipetteId(
    savedStepForms,
    orderedStepIds,
    initialDeckSetup.pipettes
  )

  // For a pristine step, if there is a `pipette` field in the form
  // (added by upstream `getDefaultsForStepType` fn),
  // then set `pipette` field of new steps to the next default pipette id.
  //
  // In order to trigger dependent field changes (eg default disposal volume),
  // update the form thru handleFormChange.
  const formHasPipetteField = formData && 'pipette' in formData
  if (formHasPipetteField && defaultPipetteId) {
    const updatedFields = handleFormChange(
      { pipette: defaultPipetteId },
      formData,
      pipetteEntities,
      labwareEntities
    )

    formData = {
      ...formData,
      // $FlowFixMe(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
      ...updatedFields,
    }
  }

  // For a pristine step, if there is a `moduleId` field in the form
  // (added by upstream `getDefaultsForStepType` fn),
  // then set `moduleID` field of new steps to the next default module id.
  const formHasModuleIdField = formData && 'moduleId' in formData
  if (
    (stepType === 'pause' || stepType === 'temperature') &&
    formHasModuleIdField
  ) {
    const moduleId = getNextDefaultTemperatureModuleId(
      savedStepForms,
      orderedStepIds,
      initialDeckSetup.modules
    )
    console.log({ moduleId })
    formData = {
      ...formData,
      moduleId,
    }
  }

  // auto-select magnetic module if it exists (assumes no more than 1 magnetic module)
  if (stepType === 'magnet') {
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

    // if no previously saved engageHeight, autopopulate with recommended value
    // recommended value is null when no labware found on module
    const engageHeight = prevEngageHeight || stringDefaultEngageHeight
    formData = { ...formData, moduleId, magnetAction, engageHeight }
  }

  return formData
}
