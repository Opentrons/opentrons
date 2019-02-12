// @flow
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import flow from 'lodash/flow'
import {getPipetteCapacity} from '../../pipettes/pipetteData'
import {initialDeckSetupStepForm} from '../../step-forms/reducers'
import type {ProtocolFile, FileLabware, FilePipette} from '../../file-types'

const PRESENT_MIGRATION_VERSION = 1

// NOTE: these constants are copied here because
// the default-values key did not exist for most protocols
// pre migrationV1 in later migration files many of these values
// should be taken from the default-values key
export const INITIAL_DECK_SETUP_STEP_ID: '__INITIAL_DECK_SETUP_STEP__' = '__INITIAL_DECK_SETUP_STEP__'
export const FIXED_TRASH_ID: 'trashId' = 'trashId'
export const DEFAULT_MM_FROM_BOTTOM_ASPIRATE = 1
export const DEFAULT_MM_FROM_BOTTOM_DISPENSE = 0.5
export const DEFAULT_WELL_ORDER_FIRST_OPTION: 't2b' = 't2b'
export const DEFAULT_WELL_ORDER_SECOND_OPTION: 'l2r' = 'l2r'

// NOTE: this function was copied on 2019-2-7 from
// formLevel/handleFormChange/dependentFieldsUpdateMoveLiquid.js
// in order to avoid further inadvertent changes to this migration
function _updatePatchPathField (patch: FormPatch, rawForm: FormData, pipetteEntities: PipetteEntities) {
  const appliedPatch = {...rawForm, ...patch}
  const {path, changeTip} = appliedPatch
  // pass-thru: incomplete form
  if (!path) return patch

  const numericVolume = Number(appliedPatch.volume) || 0
  const pipetteCapacity = getPipetteCapacity(pipetteEntities[appliedPatch.pipette])
  let pipetteCapacityExceeded = numericVolume > pipetteCapacity

  if (appliedPatch.volume && appliedPatch.pipette && appliedPatch.pipette in pipetteEntities) {
    if (pipetteCapacity) {
      if (!pipetteCapacityExceeded && ['multiDispense', 'multiAspirate'].includes(appliedPatch.path)) {
        const disposalVolume = (appliedPatch.disposalVolume_checkbox && appliedPatch.disposalVolume_volume) ? appliedPatch.disposalVolume_volume : 0
        pipetteCapacityExceeded = ((numericVolume * 2) + disposalVolume) > pipetteCapacity
      }
    }
  }

  if (pipetteCapacityExceeded) {
    return {...patch, path: 'single'}
  }

  // changeTip value incompatible with next path value
  const incompatiblePath = (
    (changeTip === 'perSource' && path === 'multiAspirate') ||
    (changeTip === 'perDest' && path === 'multiDispense'))

  if (pipetteCapacityExceeded || incompatiblePath) {
    return {...patch, path: 'single'}
  }
  return patch
}

export function renameOrderedSteps (fileData: ProtocolFile): ProtocolFile {
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
export function addInitialDeckSetupStep (fileData: ProtocolFile): ProtocolFile {
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

export const TCD_DEPRECATED_FIELD_NAMES = [
  'step-name',
  'step-details',
  'aspirate_changeTip',
  'aspirate_disposalVol_checkbox',
  'aspirate_disposalVol_volume',
  'aspirate_preWetTip',
  'aspirate_touchTip',
  'dispense_blowout_checkbox',
  'dispense_blowout_labware',
  'dispense_blowout_location',
  'offsetFromBottomMm',
  'dispense_touchTip',
  'aspirate_touchTip',
]
export const MIX_DEPRECATED_FIELD_NAMES = [
  'step-name',
  'step-details',
  'aspirate_changeTip',
  'dispense_mmFromBottom',
  'aspirate_wellOrder_first',
  'aspirate_wellOrder_second',
  'dispense_blowout_checkbox',
  'dispense_blowout_labware',
  'dispense_blowout_location',
  'touchTip',
]
export function updateStepFormKeys (fileData: ProtocolFile): ProtocolFile {
  const savedStepForms = fileData['designer-application'].data.savedStepForms
  const migratedStepForms = mapValues(savedStepForms, (formData) => {
    if (['transfer', 'consolidate', 'distribute'].includes(formData.stepType)) {
      return {
        stepName: formData['step-name'],
        stepDetails: formData['step-details'],
        changeTip: formData['aspirate_changeTip'],
        blowout_checkbox: formData['dispense_blowout_checkbox'],
        blowout_location: formData['dispense_blowout_location'] || formData['dispense_blowout_labware'],
        aspirate_touchTip_checkbox: formData['aspirate_touchTip'],
        dispense_touchTip_checkbox: formData['dispense_touchTip'],
        disposalVolume_checkbox: formData['aspirate_disposalVol_checkbox'],
        disposalVolume_volume: formData['aspirate_disposalVol_volume'],
        preWetTip: formData['aspirate_preWetTip'],
        aspirate_mmFromBottom: DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
        dispense_mmFromBottom: DEFAULT_MM_FROM_BOTTOM_DISPENSE,
        aspirate_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        aspirate_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        dispense_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        dispense_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        aspirate_wells_grouped: false,
        ...omit(formData, TCD_DEPRECATED_FIELD_NAMES),
      }
    } else if (formData.stepType === 'mix') {
      return {
        stepName: formData['step-name'],
        stepDetails: formData['step-details'],
        changeTip: formData['aspirate_changeTip'],
        mix_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        mix_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        mix_touchTip_checkbox: formData['touchTip'],
        blowout_checkbox: formData['dispense_blowout_checkbox'],
        blowout_location: formData['dispense_blowout_location'] || formData['dispense_blowout_labware'],
        ...omit(formData, TCD_DEPRECATED_FIELD_NAMES),
      }
    } else {
      return {
        stepName: formData['step-name'],
        stepDetails: formData['step-details'],
        ...omit(formData, TCD_DEPRECATED_FIELD_NAMES),
      }
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

export function replaceTCDStepsWithMoveLiquidStep (fileData: ProtocolFile): ProtocolFile {
  const savedStepForms = fileData['designer-application'].data.savedStepForms
  const migratedStepForms = mapValues(savedStepForms, (formData) => {
    const {stepType} = formData

    if (!['transfer', 'consolidate', 'distribute'].includes(stepType)) return formData

    const pathMap = {transfer: 'single', consolidate: 'multiAspirate', distribute: 'multiDispense'}
    const proposedPatch = {path: pathMap[stepType], stepType: 'moveLiquid', aspirate_wells_grouped: false}

    const pipetteEntities = mapValues(fileData['pipettes'], (pipette, pipetteId) => ({
      ...pipette,
      tiprackModel: fileData['designer-application'].data.pipetteTiprackAssignments[pipetteId],
    }))
    // update path field patch if incompatible; fallback to 'single'
    const resolvedPatch = _updatePatchPathField(proposedPatch, formData, pipetteEntities)
    return {...formData, ...resolvedPatch}
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

export function updateMigrationVersion (fileData: ProtocolFile): ProtocolFile {
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
      updateStepFormKeys,
      replaceTCDStepsWithMoveLiquidStep,
      updateMigrationVersion,
    ])(fileData)
    return migratedFile
  }
}
