// @flow
import mapValues from 'lodash/mapValues'
import merge from 'lodash/merge'
import omit from 'lodash/omit'
import {initialDeckSetupStepForm, type SavedStepFormState} from '../step-forms/reducers'
import {INITIAL_DECK_SETUP_STEP_ID} from '../constants'
import type {ProtocolFile, FileLabware, FilePipette} from '../file-types'

function _addDeckSetupStepIfMissing (fileData: ProtocolFile): SavedStepFormState {
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
    ...savedStepForms,
    [INITIAL_DECK_SETUP_STEP_ID]: deckSetupStep,
  }
}

function migrateSavedStepForms (fileData: ProtocolFile): SavedStepFormState {
  const savedStepForms = _addDeckSetupStepIfMissing(fileData)

  // migrate old kebab-case keys to camelCase
  return mapValues(savedStepForms, (stepForm) => ({
    ...omit(stepForm, ['step-name', 'step-details']),
    stepName: stepForm.stepName || stepForm['step-name'],
    stepDetails: stepForm.stepDetails || stepForm['step-details'],
  }))
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
