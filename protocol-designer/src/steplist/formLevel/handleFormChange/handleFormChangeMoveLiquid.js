// @flow
import makeFieldUpdater from './makeFieldUpdater'
import {chainFormUpdaters, getChannels, getAllWells} from './utils'
import type {FormData} from '../../../form-types'
import type {FormPatch} from '../../actions/types'
import type {LabwareEntities, PipetteEntities} from '../../../step-forms/types'

type WellRatio = 'n:n' | '1:many' | 'many:1' // TODO IMMEDIATELY import from somewhere more general

// type WellRatioUpdate = {
//   prevKeyValue: WellRatio,
//   nextKeyValue: WellRatio,
//   fields: Array<{name: string, prev: string, next: string}>,
// }

const wellRatioUpdatesMap = [
  {
    prevKeyValue: 'n:n',
    nextKeyValue: '1:many',
    fields: [
      {name: 'changeTip', prev: 'perSource', next: 'always'},
      {name: 'changeTip', prev: 'perDest', next: 'always'},
    ],
  },
  {
    prevKeyValue: 'n:n',
    nextKeyValue: 'many:1',
    fields: [
      // no updates, all possible values are OK
    ],
  },
  {
    prevKeyValue: '1:many',
    nextKeyValue: 'n:n',
    fields: [
      {name: 'changeTip', prev: 'perSource', next: 'always'},
      {name: 'changeTip', prev: 'perDest', next: 'always'},
    ],
  },
  {
    prevKeyValue: '1:many',
    nextKeyValue: 'many:1',
    fields: [
      {name: 'changeTip', prev: 'perSource', next: 'always'},
      {name: 'changeTip', prev: 'perDest', next: 'always'},
      {name: 'path', prev: 'multiDispense', next: 'single'},
    ],
  },
  {
    prevKeyValue: 'many:1',
    nextKeyValue: 'n:n',
    fields: [
      {name: 'path', prev: 'multiAspirate', next: 'single'},
    ],
  },
  {
    prevKeyValue: 'many:1',
    nextKeyValue: '1:many',
    fields: [
      {name: 'changeTip', prev: 'perSource', next: 'always'},
      {name: 'path', prev: 'multiAspirate', next: 'single'},
    ],
  },
]
const wellRatioUpdater = makeFieldUpdater(wellRatioUpdatesMap)

function getWellRatio (sourceWells: mixed, destWells: mixed): ?WellRatio {
  if (
    !Array.isArray(sourceWells) || sourceWells.length === 0 ||
    !Array.isArray(destWells) || destWells.length === 0
  ) {
    return null
  }
  if (sourceWells.length === destWells.length) {
    return 'n:n'
  }
  if (sourceWells.length === 1 && destWells.length > 1) {
    return '1:many'
  }
  if (sourceWells.length > 1 && destWells.length === 1) {
    return 'many:1'
  }
  console.assert(false, `unexpected well ratio: ${sourceWells.length}:${destWells.length}`)
  return null
}

function updatePathField (patch, baseForm, pipetteEntities) {
  const appliedPatch = {...baseForm, ...patch}
  const {path, changeTip} = appliedPatch
  // pass-thru: incomplete form
  if (!path) return patch

  // TODO IMMEDIATELY: why are tests not failing when this is true?
  // TODO IMMEDIATELY: pipette capacity from hydrated form, not placeholder `false`
  const pipetteCapacityExceeded = false
  if (pipetteCapacityExceeded) {
    return {...patch, path: 'single'}
  }

  // changeTip value incompatible with path -> 'single'
  if (
    (changeTip === 'perSource' && path === 'multiAspirate') ||
    (changeTip === 'perDest' && path === 'multiDispense')
  ) {
    return {...patch, path: 'single'}
  }
  return patch
}

const updateFieldsOnLabwareChange = (patch: FormPatch, baseForm: FormData): FormPatch => {
  const sourceLabwareChanged = patch.aspirate_labware &&
    patch.aspirate_labware !== baseForm.aspirate_labware
  const destLabwareChanged = patch.dispense_labware &&
    patch.dispense_labware !== baseForm.dispense_labware

  if (!sourceLabwareChanged && !destLabwareChanged) return patch

  return {
    ...(sourceLabwareChanged
      ? {
        'aspirate_wells': null,
        'aspirate_mmFromBottom': null,
        'aspirate_touchTipMmFromBottom': null,
      } : {}),
    ...(destLabwareChanged
      ? {
        'dispense_wells': null,
        'dispense_mmFromBottom': null,
        'dispense_touchTipMmFromBottom': null,
      } : {}),
  }
}

const clearFieldsOnPipetteChange = (
  patch: FormPatch,
  baseForm: FormData,
  pipetteEntities: PipetteEntities
) => {
  // when pipette ID is changed (to another ID, or to null),
  // set any flow rates, mix volumes, air gaps, or disposal volumes to null
  if (patch.pipette !== undefined && baseForm.pipette !== patch.pipette) {
    return {
      ...patch,
      aspirate_flowRate: null,
      dispense_flowRate: null,
      aspirate_mix_volume: null,
      dispense_mix_volume: null,
      disposalVolume_volume: null,
    }
  }

  return patch
}

const updateFieldsOnPipetteChannelChange = (
  patch: FormPatch,
  baseForm: FormData,
  labwareEntities: LabwareEntities,
  pipetteEntities: PipetteEntities
) => {
  if (patch.pipette === undefined) return patch
  let update = {}

  const prevChannels = getChannels(baseForm.pipette, pipetteEntities)
  const nextChannels = typeof patch.pipette === 'string'
    ? getChannels(patch.pipette, pipetteEntities)
    : null

  const singleToMulti = prevChannels === 1 && nextChannels === 8
  const multiToSingle = prevChannels === 8 && nextChannels === 1

  if (patch.pipette === null || singleToMulti) {
    // clear all well selection
    update = {aspirate_wells: null, dispense_wells: null}
  } else if (multiToSingle) {
    // multi-channel to single-channel: convert primary wells to all wells
    const sourceLabwareId = baseForm.aspirate_labware
    const destLabwareId = baseForm.dispense_labware

    const sourceLabware = sourceLabwareId && labwareEntities[sourceLabwareId]
    const sourceLabwareType = sourceLabware && sourceLabware.type
    const destLabware = destLabwareId && labwareEntities[destLabwareId]
    const destLabwareType = destLabware && destLabware.type

    update = {
      aspirate_wells: getAllWells(baseForm.aspirate_wells, sourceLabwareType),
      dispense_wells: getAllWells(baseForm.dispense_wells, destLabwareType),
    }
  }
  return {...patch, ...update}
}

export default function handleFormChangeMoveLiquid (
  originalPatch: FormPatch,
  baseForm: FormData, // NOTE: this is NOT hydrated, it's the raw form as stored in the reducer
  pipetteEntities: PipetteEntities,
  labwareEntities: LabwareEntities
): FormPatch {
  const updateFieldsOnWellRatioChange = (chainPatch) => {
    const prevWellRatio = getWellRatio(baseForm.aspirate_wells, baseForm.dispense_wells)
    const nextWellRatio = getWellRatio(chainPatch.aspirate_wells, chainPatch.dispense_wells)

    if (prevWellRatio && nextWellRatio) {
      return wellRatioUpdater(prevWellRatio, nextWellRatio, {...baseForm, ...chainPatch})
    }
    return chainPatch
  }

  // sequentially modify parts of the patch until it's fully updated
  return chainFormUpdaters(originalPatch, [
    chainPatch => updateFieldsOnLabwareChange(chainPatch, baseForm),
    chainPatch => updateFieldsOnPipetteChannelChange(chainPatch, baseForm, labwareEntities, pipetteEntities),
    chainPatch => clearFieldsOnPipetteChange(chainPatch, baseForm, pipetteEntities),
    chainPatch => updatePathField(chainPatch, baseForm, pipetteEntities),
    updateFieldsOnWellRatioChange,
  ])
}
