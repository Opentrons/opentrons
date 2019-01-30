// @flow
import mapValues from 'lodash/mapValues'
import merge from 'lodash/merge'
import omit from 'lodash/omit'
import {initialDeckSetupStepForm, type SavedStepFormState} from '../step-forms/reducers'
import {INITIAL_DECK_SETUP_STEP_ID} from '../constants'
import type {ProtocolFile, FileLabware, FilePipette} from '../file-types'
import type {FormData} from '../form-types'

function _addDeckSetupStepIfMissing (fileData: ProtocolFile): ProtocolFile{
  // builds the initial deck setup step for older protocols that didn't have one.
  const savedStepForms = fileData['designer-application'].data.savedStepForms

  // already has deck setup step, pass thru
  if (savedStepForms[INITIAL_DECK_SETUP_STEP_ID]) return savedStepForms

  const additionalLabware = mapValues(fileData.labware, (labware: FileLabware) => labware.slot)
  const pipetteLocations = mapValues(fileData.pipettes, (pipette: FilePipette) => pipette.mount)

  const deckSetupStep = {
    ...initialDeckSetupStepForm,
    labwareLocationUpdate: {
      ...initialDeckSetupStepForm.labwareLocationUpdate,
      ...additionalLabware,
    },
    pipetteLocationUpdate: {
      ...initialDeckSetupStepForm.pipetteLocationUpdate,
      ...pipetteLocations,
    },
  }
  return {
    ...fileData,
    'designer-application': {
      ...fileData['designer-application'],
      data: {
        ...fileData['designer-application'].data,
        savedStepForms: {
          ...savedStepForms,
          [INITIAL_DECK_SETUP_STEP_ID]: deckSetupStep,
        }
      }
    }
  }
}

function _consolidateToFlexibleTransfer (formData: FormData): FormData {
  return {
    ...formData,
    stepType: 'moveLiquid',
  }
}

function _distributeToFlexibleTransfer (formData: FormData): FormData {

}

function _migrateToFlexibleTransfer (fileData: ProtocolFile): $PropertyType<ProtocolFile, 'designer-application'>{
  const savedStepForms = fileData['designer-application'].data.savedStepForms
  return mapValues(savedStepForms, (formData) => {
    const {stepType} = formData
    if (stepType) return formData
    let migratedFormData = {formData
    if (stepType === 'consolidate') {
      return _consolidateToFlexibleTransfer(formData)
    } else if (stepType === 'distribute') {
      return _distributeToFlexibleTransfer(formData)
    } else if (stepType === 'transfer') {
      return _distributeToFlexibleTransfer(formData)
    }
  })
}

function migrateSavedStepForms (fileData: ProtocolFile): SavedStepFormState {
  const withDeckSetup = _addDeckSetupStepIfMissing(fileData)

  // migrate old kebab-case keys to camelCase
  const withDeckSetupAndCamelCase = mapValues(withDeckSetup, (stepForm) => ({
    ...omit(stepForm, ['step-name', 'step-details']),
    stepName: stepForm.stepName || stepForm['step-name'],
    stepDetails: stepForm.stepDetails || stepForm['step-details'],
  }))

  return _migrateToFlexibleTransfer(withDeckSetupAndCamelCase)
}

export default function migrateFile (file: any): ProtocolFile {
  const updatePdMetadata = {
    'designer-application': {
      data: {
        // orderedSteps -> orderedStepIds renaming
        orderedStepIds: file['designer-application'].data.orderedStepIds ||
          file['designer-application'].data.orderedSteps,
        orderedSteps: undefined,
        // add initial deck setup step if missing
        savedStepForms: migrateSavedStepForms(file),
      },
    },
  }

  return merge(
    {},
    file,
    updatePdMetadata,
  )
}
