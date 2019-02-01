// @flow
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import flow from 'lodash/flow'
import {initialDeckSetupStepForm} from '../../step-forms/reducers'
import {INITIAL_DECK_SETUP_STEP_ID} from '../../constants'
import type {ProtocolFile, FileLabware, FilePipette} from '../../file-types'
import type {FormData} from '../../form-types'

const PRESENT_MIGRATION_VERSION = 1

function renameOrderedSteps (fileData: ProtocolFile): ProtocolFile {
  const {data} = fileData['designer-application']
  return {
    ...fileData,
    'designer-application': {
      ...fileData['designer-application'],
      data: {
        ...data,
        orderedStepIds: data.orderedStepIds || data.orderedSteps,
        orderedSteps: undefined,
      },
    },
  }
}

// builds the initial deck setup step for older protocols that didn't have one.
function addInitialDeckSetupStep (fileData: ProtocolFile): ProtocolFile {
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

function stepFormKeysToCamelCase (fileData: ProtocolFile): ProtocolFile {
  // migrate old kebab-case keys to camelCase
  return {
    ...fileData,
    'designer-application': {
      ...fileData['designer-application'],
      data: {
        ...fileData['designer-application'].data,
        savedStepForms: mapValues(fileData['designer-application'].data.savedStepForms, (stepForm) => ({
          ...omit(stepForm, ['step-name', 'step-details']),
          stepName: stepForm.stepName || stepForm['step-name'],
          stepDetails: stepForm.stepDetails || stepForm['step-details'],
        })),
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

function replaceTCDStepsWithMoveLiquidStep (fileData: ProtocolFile): ProtocolFile {
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
      data: {
        ...fileData['designer-application'].data,
        savedStepForms: migratedStepForms,
      },
    },
  }
}

function updateMigrationVersion (fileData: ProtocolFile): ProtocolFile {
  return {
    ...fileData,
    'designer-application': {
      ...fileData['designer-application'],
      migrationVersion: PRESENT_MIGRATION_VERSION,
    },
  }
}

export default function migrateFile (fileData: any): ProtocolFile {
  const {migrationVersion} = fileData['designer-application']
  if (migrationVersion && migrationVersion >= PRESENT_MIGRATION_VERSION) {
    return fileData
  } else {
    return flow([
      renameOrderedSteps,
      addInitialDeckSetupStep,
      stepFormKeysToCamelCase,
      replaceTCDStepsWithMoveLiquidStep,
      updateMigrationVersion,
    ])
  }
}
