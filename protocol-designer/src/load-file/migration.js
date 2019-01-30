// @flow
import mapValues from 'lodash/mapValues'
import merge from 'lodash/merge'
import omit from 'lodash/omit'
import {initialDeckSetupStepForm, type SavedStepFormState} from '../step-forms/reducers'
import {INITIAL_DECK_SETUP_STEP_ID} from '../constants'
import type {ProtocolFile, FileLabware, FilePipette} from '../file-types'
import type {FormData} from '../form-types'

function _addDeckSetupStepIfMissing (fileData: ProtocolFile): ProtocolFile {
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
        },
      },
    },
  }
}

function _consolidateToMoveLiquid (formData: FormData): FormData {
  return {
    ...formData,
    stepType: 'moveLiquid',
  }
}

function _distributeToMoveLiquid (formData: FormData): FormData {
  return {
    ...formData,
    stepType: 'moveLiquid',
  }
}

function _transferToMoveLiquid (formData: FormData): FormData {
  return {
    ...formData,
    stepType: 'moveLiquid',
  }
}

const FLEXIBLE_TRANSFER_MIGRATION_VERSION = 1
function _migrateToMoveLiquid (fileData: ProtocolFile): $PropertyType<ProtocolFile, 'designer-application'> {
  const {migrationVersion} = fileData['designer-application']
  if (migrationVersion && migrationVersion >= FLEXIBLE_TRANSFER_MIGRATION_VERSION) return fileData

  const savedStepForms = fileData['designer-application'].data.savedStepForms
  const migratedStepForms = mapValues(savedStepForms, (formData) => {
    const {stepType} = formData
    if (stepType === 'consolidate') {
      return _consolidateToMoveLiquid(formData)
    } else if (stepType === 'distribute') {
      return _distributeToMoveLiquid(formData)
    } else if (stepType === 'transfer') {
      return _transferToMoveLiquid(formData)
    }
  })
  return {
    ...fileData,
    'designer-application': {
      ...fileData['designer-application'],
      migrationVersion: FLEXIBLE_TRANSFER_MIGRATION_VERSION,
      data: {
        ...fileData['designer-application'].data,
        savedStepForms: migratedStepForms,
      },
    },
  }
}

function migrateSavedStepForms (fileData: ProtocolFile): SavedStepFormState {
  const withDeckSetup = _addDeckSetupStepIfMissing(fileData)

  // migrate old kebab-case keys to camelCase
  const withDeckSetupAndCamelCase = mapValues(withDeckSetup, (stepForm) => ({
    ...omit(stepForm, ['step-name', 'step-details']),
    stepName: stepForm.stepName || stepForm['step-name'],
    stepDetails: stepForm.stepDetails || stepForm['step-details'],
  }))

  return _migrateToMoveLiquid(withDeckSetupAndCamelCase)
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
