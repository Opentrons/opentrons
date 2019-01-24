// @flow
import assert from 'assert'
import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import some from 'lodash/some'
import {createSelector} from 'reselect'
import {getIsTiprack, getPipetteNameSpecs, getLabware} from '@opentrons/shared-data'
import {DISPOSAL_LABWARE_TYPES, INITIAL_DECK_SETUP_STEP_ID} from '../../constants'
import {
  generateNewForm,
  getFormWarnings,
  getFormErrors,
  stepFormToArgs,
} from '../../steplist/formLevel'
import {
  hydrateField,
  getFieldErrors,
} from '../../steplist/fieldLevel'
import {addSpecsToPipetteInvariantProps} from '../utils'
import {labwareToDisplayName} from '../../labware-ingred/utils'

import type {ElementProps} from 'react'
import type {
  DeckSlot,
  DropdownOption,
  Mount,
} from '@opentrons/components'
import {typeof InstrumentGroup as InstrumentGroupProps} from '@opentrons/components'

import type {
  FormError,
  FormWarning,
} from '../../steplist/formLevel'

import type {
  StepArgsAndErrors,
  StepFormAndFieldErrors,
  StepItemData,
  StepFormContextualState,
} from '../../steplist/types'
import type {
  InitialDeckSetup,
  LabwareEntities,
  LabwareOnDeck,
  PipetteEntities,
  PipetteOnDeck,
  FormPipettesByMount,
} from '../types'
import type {RootState} from '../reducers'
import type {BaseState, Selector, Options} from '../../types'
import type {FormData, StepIdType, StepType} from '../../form-types'
import type {Labware, LabwareTypeById} from '../../labware-ingred/types'

// TODO: BC 2018-10-30 after separation of getStepArgs and getStepErrors
// , move the NO_SAVED_FORM_ERROR into a separate wrapping selector
// it is currently there to keep the step item error state from appearing
// before you've saved the form once
const NO_SAVED_FORM_ERROR = 'NO_SAVED_FORM_ERROR'

const rootSelector = (state: BaseState): RootState => state.stepForms

export const getLabwareEntities: Selector<LabwareEntities> = createSelector(
  rootSelector,
  (state) => state.labwareInvariantProperties
)

export const getPipetteEntities: Selector<PipetteEntities> = createSelector(
  rootSelector,
  (state) => addSpecsToPipetteInvariantProps(state.pipetteInvariantProperties)
)

export const getInitialDeckSetup: Selector<InitialDeckSetup> = createSelector(
  rootSelector,
  getLabwareEntities,
  getPipetteEntities,
  (state, labwareInvariantProperties, pipetteInvariantProperties) => {
    const initialSetupStep = state.savedStepForms[INITIAL_DECK_SETUP_STEP_ID]
    assert(
      initialSetupStep && initialSetupStep.stepType === 'manualIntervention',
      'expected initial deck setup step to be "manualIntervention" step')
    const labwareLocations = (initialSetupStep && initialSetupStep.labwareLocationUpdate) || {}
    const pipetteLocations = (initialSetupStep && initialSetupStep.pipetteLocationUpdate) || {}
    return {
      labware: mapValues(labwareLocations, (slot: DeckSlot, labwareId: string): LabwareOnDeck => {
        return {slot, ...labwareInvariantProperties[labwareId]}
      }),
      pipettes: mapValues(pipetteLocations, (mount: Mount, pipetteId: string): PipetteOnDeck => {
        return {mount, ...pipetteInvariantProperties[pipetteId]}
      }),
    }
  }
)

// TODO: Ian 2019-01-24 this selector needs info from the labware atoms's
// `containers` reducer as well as stepForms,
// so it probably doesn't belong in step-forms/...
// Also, the `Labware` type should probably be deprecated later on
// $FlowFixMe I think it's a flow bug?
export const getLabwareById: Selector<{[labwareId: string]: ?Labware}> = createSelector(
  getInitialDeckSetup,
  state => state.labwareIngred.containers, // HACK to avoid circular dependency
  (initialDeckSetup, displayLabwareById) => mapValues(
    initialDeckSetup.labware,
    (l: LabwareOnDeck, id: string): ?Labware => {
      const displayLabware = displayLabwareById[id]
      return displayLabware
        ? {
          nickname: displayLabware.nickname,
          disambiguationNumber: displayLabware.disambiguationNumber,
          id,
          type: l.type,
          slot: l.slot,
        }
        : null
    })
)

export const getLabwareNicknamesById: Selector<{[labwareId: string]: string}> = createSelector(
  getLabwareById,
  (labwareById) => mapValues(
    labwareById,
    labwareToDisplayName,
  )
)

/** Returns options for disposal (e.g. fixed trash and trash box) */
export const getDisposalLabwareOptions: Selector<Options> = createSelector(
  getLabwareById,
  getLabwareNicknamesById,
  (labwareById, names) => reduce(labwareById, (acc: Options, labware: Labware, labwareId): Options => {
    if (!labware.type || !DISPOSAL_LABWARE_TYPES.includes(labware.type)) {
      return acc
    }
    return [
      ...acc,
      {
        name: names[labwareId],
        value: labwareId,
      },
    ]
  }, [])
)

/** Returns options for dropdowns, excluding tiprack labware */
export const getLabwareOptions: Selector<Options> = createSelector(
  getLabwareById,
  getLabwareNicknamesById,
  (labwareById, names) => reduce(labwareById, (acc: Options, labware: Labware, labwareId): Options => {
    const isTiprack = getIsTiprack(labware.type)
    if (!labware.type || isTiprack) {
      return acc
    }
    return [
      ...acc,
      {
        name: names[labwareId],
        value: labwareId,
      },
    ]
  }, [])
)

export const getLabwareTypes: Selector<LabwareTypeById> = createSelector(
  getLabwareById,
  (labwareById) => mapValues(
    labwareById,
    (labware: Labware) => labware.type
  )
)

// TODO: Ian 2019-01-24 this selector needs info from the labware atoms's
// `containers` reducer as well as stepForms,
// so it probably doesn't belong in step-forms/...
export const getSelectedLabware: Selector<?Labware> = createSelector(
  state => state.labwareIngred.selectedContainerId, // HACK to avoid circular dependency
  getLabwareById,
  (selectedLabwareId, labware) =>
    (selectedLabwareId && labware[selectedLabwareId]) || null
)

type ContainersBySlot = {[DeckSlot]: {...Labware, containerId: string}}
export const getContainersBySlot: Selector<ContainersBySlot> = createSelector(
  getLabwareById,
  containers => reduce(
    containers,
    (acc: ContainersBySlot, containerObj: Labware, containerId: string) => ({
      ...acc,
      // NOTE: containerId added in so you still have a reference
      [containerObj.slot]: {...containerObj, containerId},
    }),
    {})
)

export const getPermittedTipracks: Selector<Array<string>> = createSelector(
  getInitialDeckSetup,
  (initialDeckSetup) =>
    reduce(initialDeckSetup.pipettes, (acc: Array<string>, pipette: PipetteOnDeck) => {
      return (pipette.tiprackModel)
        ? [...acc, pipette.tiprackModel]
        : acc
    }, [])
)

function _getPipetteDisplayName (name: string): string {
  const pipetteSpecs = getPipetteNameSpecs(name)
  if (!pipetteSpecs) return 'Unknown Pipette'
  return pipetteSpecs.displayName
}

// TODO: Ian 2018-12-20 EVENTUALLY make this `getEquippedPipetteOptionsForStepId`, so it tells you
// equipped pipettes per step id instead of always using initial deck setup
// (for when we support multiple deck setup steps)
export const getEquippedPipetteOptions: Selector<Array<DropdownOption>> = createSelector(
  getInitialDeckSetup,
  (initialDeckSetup) =>
    reduce(initialDeckSetup.pipettes, (acc: Array<DropdownOption>, pipette: PipetteOnDeck, id: string) => {
      const nextOption = {
        name: _getPipetteDisplayName(pipette.name),
        value: id,
      }
      return [...acc, nextOption]
    }, [])
)

// Formats pipette data specifically for file page InstrumentGroup component
type PipettesForInstrumentGroup = ElementProps<InstrumentGroupProps>
export const getPipettesForInstrumentGroup: Selector<PipettesForInstrumentGroup> = createSelector(
  getInitialDeckSetup,
  (initialDeckSetup) => reduce(initialDeckSetup.pipettes, (acc: PipettesForInstrumentGroup, pipetteOnDeck: PipetteOnDeck, pipetteId) => {
    const pipetteSpec = getPipetteNameSpecs(pipetteOnDeck.name)
    const tiprackSpec = getLabware(pipetteOnDeck.tiprackModel)

    const pipetteForInstrumentGroup = {
      mount: pipetteOnDeck.mount,
      channels: pipetteSpec ? pipetteSpec.channels : undefined,
      description: _getPipetteDisplayName(pipetteOnDeck.name),
      isDisabled: false,
      tiprackModel: tiprackSpec ? `${tiprackSpec.metadata.tipVolume || '?'} uL` : undefined,
      tiprack: {model: pipetteOnDeck.tiprackModel},
    }

    return {
      ...acc,
      [pipetteOnDeck.mount]: pipetteForInstrumentGroup,
    }
  }, {})
)

export const getPipettesForEditPipetteForm: Selector<FormPipettesByMount> = createSelector(
  getInitialDeckSetup,
  (initialDeckSetup) => reduce(initialDeckSetup.pipettes, (acc: FormPipettesByMount, pipetteOnDeck: PipetteOnDeck, id): FormPipettesByMount => {
    const pipetteSpec = getPipetteNameSpecs(pipetteOnDeck.name)
    const tiprackSpec = getLabware(pipetteOnDeck.tiprackModel)

    if (!pipetteSpec || !tiprackSpec) return acc

    const pipetteForInstrumentGroup = {
      pipetteName: pipetteOnDeck.name,
      tiprackModel: tiprackSpec.metadata.name,
    }

    return {
      ...acc,
      [pipetteOnDeck.mount]: pipetteForInstrumentGroup,
    }
  }, {left: {pipetteName: null, tiprackModel: null}, right: {pipetteName: null, tiprackModel: null}})
)

export const getUnsavedForm: Selector<?FormData> = createSelector(
  rootSelector,
  (state) => state.unsavedForm
)

export const getOrderedStepIds: Selector<Array<StepIdType>> = createSelector(
  rootSelector,
  (state) => state.orderedStepIds
)

export const getSavedStepForms: Selector<*> = createSelector(
  rootSelector,
  (state) => state.savedStepForms
)

const getOrderedSavedForms: Selector<Array<FormData>> = createSelector(
  getOrderedStepIds,
  getSavedStepForms,
  (orderedStepIds, savedStepForms) => {
    return orderedStepIds
      .map(stepId => savedStepForms[stepId])
      .filter(form => form && form.id != null) // NOTE: for old protocols where stepId could === 0, need to do != null here
  }
)

// TODO type with hydrated form type
const _getAllErrorsFromHydratedForm = (hydratedForm: FormData): StepFormAndFieldErrors => {
  let errors: StepFormAndFieldErrors = {}

  forEach(hydratedForm, (value, fieldName) => {
    const fieldErrors = getFieldErrors(fieldName, value)
    if (fieldErrors && fieldErrors.length > 0) {
      errors = {
        ...errors,
        field: {
          ...errors.field,
          [fieldName]: fieldErrors,
        },
      }
    }
  })
  const formErrors = getFormErrors(hydratedForm.stepType, hydratedForm)
  if (formErrors && formErrors.length > 0) {
    errors = {...errors, form: formErrors}
  }

  return errors
}

export const getHydrationContext: Selector<StepFormContextualState> = createSelector(
  getLabwareEntities,
  getPipetteEntities,
  (labware, pipettes) => ({labware, pipettes})
)

export const getHydratedUnsavedFormErrors: Selector<?StepFormAndFieldErrors> = createSelector(
  getUnsavedForm,
  getHydrationContext,
  (unsavedForm, contextualState) => {
    if (!unsavedForm) return null
    const hydratedForm = mapValues(unsavedForm, (value, name) => (
      hydrateField(contextualState, name, value)
    ))

    const errors = _getAllErrorsFromHydratedForm(hydratedForm)
    return errors
  }
)

export const getArgsAndErrorsByStepId: Selector<{[StepIdType]: StepArgsAndErrors}> = createSelector(
  getOrderedSavedForms,
  getHydrationContext,
  (stepForms, contextualState) => {
    return reduce(stepForms, (acc, stepForm) => {
      const hydratedForm = mapValues(stepForm, (value, name) => (
        hydrateField(contextualState, name, value)
      ))
      const errors = _getAllErrorsFromHydratedForm(hydratedForm)
      const nextStepData = isEmpty(errors)
        ? {stepArgs: stepFormToArgs(hydratedForm)}
        : {errors, stepArgs: null}

      return {
        ...acc,
        [stepForm.id]: nextStepData,
      }
    }, {})
  }
)

export const getFormAndFieldErrorsByStepId: Selector<{[StepIdType]: StepFormAndFieldErrors}> = createSelector(
  getArgsAndErrorsByStepId,
  (stepsArgsAndErrors) => (
    mapValues(stepsArgsAndErrors, (argsAndErrors) => {
      const formErrors = argsAndErrors.errors && argsAndErrors.errors.form
      if (
        formErrors &&
        some(formErrors, error => error.title === NO_SAVED_FORM_ERROR)
      ) {
        return {}
      }
      return argsAndErrors.errors
    })
  )
)

export const getIsNewStepForm = createSelector(
  getUnsavedForm,
  getSavedStepForms,
  (formData, savedForms) =>
    (formData && formData.id != null)
      ? !savedForms[formData.id]
      : true
)

export const getFormLevelWarningsForUnsavedForm: Selector<Array<FormWarning>> = createSelector(
  getUnsavedForm,
  getHydrationContext,
  (unsavedFormData, contextualState) => {
    if (!unsavedFormData) return []
    const {id, stepType, ...fields} = unsavedFormData
    const hydratedFields = mapValues(fields, (value, name) => hydrateField(contextualState, name, value))
    return getFormWarnings(stepType, hydratedFields)
  }
)

export const getFormLevelErrors: Selector<Array<FormError>> = createSelector(
  getUnsavedForm,
  getHydrationContext,
  (unsavedFormData, contextualState) => {
    if (!unsavedFormData) return []
    const {id, stepType, ...fields} = unsavedFormData
    const hydratedFields = mapValues(fields, (value, name) => hydrateField(contextualState, name, value))
    return getFormErrors(stepType, hydratedFields)
  }
)

// TODO: Ian 2018-12-19 this is DEPRECATED, should be removed once legacySteps reducer is removed
const getSteps = (state: BaseState) => rootSelector(state).legacySteps
export function _getStepFormData (state: BaseState, stepId: StepIdType, newStepType?: StepType): ?FormData {
  const existingStep = getSavedStepForms(state)[stepId]

  if (existingStep) {
    return existingStep
  }

  const steps = getSteps(state)
  const stepTypeFromStepReducer = steps[stepId] && steps[stepId].stepType
  const stepType = newStepType || stepTypeFromStepReducer

  if (!stepType) {
    console.error(`New step with id "${stepId}" was added with no stepType, could not generate form`)
    return null
  }

  return generateNewForm({
    stepId,
    stepType: stepType,
  })
}

// TODO: Ian 2018-12-19 this is DEPRECATED, should be removed once legacySteps reducer is removed
export const getAllSteps: Selector<{[stepId: StepIdType]: StepItemData}> = createSelector(
  getSteps,
  getSavedStepForms,
  (steps, savedForms) => {
    return mapValues(
      steps,
      (step: StepItemData, id: StepIdType): StepItemData => {
        const savedForm = (savedForms && savedForms[id]) || null
        return {
          ...steps[id],
          formData: savedForm,
          title: savedForm ? savedForm.stepName : step.stepType,
          description: savedForm ? savedForm.stepDetails : null,
        }
      }
    )
  }
)
