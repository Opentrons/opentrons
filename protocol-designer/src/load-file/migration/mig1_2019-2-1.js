// @flow
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import flow from 'lodash/flow'
import {initialDeckSetupStepForm} from '../../step-forms/reducers'
import {updatePatchPathField} from '../../steplist/formLevel/handleFormChange/dependentFieldsUpdateMoveLiquid'
import {INITIAL_DECK_SETUP_STEP_ID} from '../../constants'
import type {ProtocolFile, FileLabware, FilePipette} from '../../file-types'

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
  if (savedStepForms[INITIAL_DECK_SETUP_STEP_ID]) return fileData

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

function replaceTCDStepsWithMoveLiquidStep (fileData: ProtocolFile): ProtocolFile {
  const savedStepForms = fileData['designer-application'].data.savedStepForms
  const migratedStepForms = mapValues(savedStepForms, (formData) => {
    const {stepType} = formData

    if (!['transfer', 'consolidate', 'distribute'].includes(stepType)) return formData

    const deprecatedFieldNames = [
      'aspirate_changeTip',
      'aspirate_disposalVol_checkbox',
      'aspirate_disposalVol_volume',
      'dispense_blowout_checkbox',
      'dispense_blowout_labware',
    ]

    const passThroughFormData = {
      ...omit(formData, deprecatedFieldNames),
      disposalVolume_checkbox: formData.disposalVolume_checkbox || formData['aspirate_disposalVol_checkbox'],
      disposalVolume_volume: formData.disposalVolume_volume || formData['aspirate_disposalVol_volume'],
      changeTip: formData.changeTip || formData['aspirate_changeTip'],
      blowout_checkbox: formData.blowout_checkbox || formData['dispense_blowout_checkbox'],
      blowout_location: formData.blowout_location || formData['dispense_blowout_labware'],
    }

    const pathMap = {transfer: 'single', consolidate: 'multiAspirate', distribute: 'multiDispense'}
    const proposedPatch = {path: pathMap[stepType], stepType: 'moveLiquid', aspirate_wells_grouped: false}

    const pipetteEntities = mapValues(fileData['pipettes'], (pipette, pipetteId) => ({
      ...pipette,
      tiprackModel: fileData['designer-application'].data.pipetteTiprackAssignments[pipetteId],
    }))
    // update path field patch if incompatible; fallback to 'single'
    const resolvedPatch = updatePatchPathField(proposedPatch, passThroughFormData, pipetteEntities)
    return {...passThroughFormData, ...resolvedPatch}
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
    const migratedFile = flow([
      renameOrderedSteps,
      addInitialDeckSetupStep,
      stepFormKeysToCamelCase,
      replaceTCDStepsWithMoveLiquidStep,
      updateMigrationVersion,
    ])(fileData)
    return migratedFile
  }
}
