import assert from 'assert'
import clamp from 'lodash/clamp'
import pick from 'lodash/pick'
import round from 'lodash/round'
import { getPipetteNameSpecs } from '@opentrons/shared-data'
import {
  SOURCE_WELL_BLOWOUT_DESTINATION,
  DEST_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'
import { getWellRatio } from '../../utils'
import { getDefaultsForStepType } from '../getDefaultsForStepType'
import { makeConditionalPatchUpdater } from './makeConditionalPatchUpdater'
import {
  chainPatchUpdaters,
  fieldHasChanged,
  getChannels,
  getDefaultWells,
  getAllWellsFromPrimaryWells,
  getMaxDisposalVolumeForMultidispense,
  volumeInCapacityForMulti,
  DISPOSAL_VOL_DIGITS,
} from './utils'
import type {
  LabwareEntities,
  PipetteEntities,
} from '@opentrons/step-generation'
import { FormData, StepFieldName } from '../../../form-types'
import { FormPatch } from '../../actions/types'
import {
  getMinPipetteVolume,
  getPipetteCapacity,
} from '../../../pipettes/pipetteData'

// TODO: Ian 2019-02-21 import this from a more central place - see #2926
const getDefaultFields = (...fields: StepFieldName[]): FormPatch =>
  pick(getDefaultsForStepType('moveLiquid'), fields)

const wellRatioUpdatesMap = [
  {
    prevValue: 'n:n',
    nextValue: '1:many',
    dependentFields: [
      {
        name: 'changeTip',
        prevValue: 'perSource',
        nextValue: 'always',
      },
      {
        name: 'changeTip',
        prevValue: 'perDest',
        nextValue: 'always',
      },
    ],
  },
  {
    prevValue: 'n:n',
    nextValue: 'many:1',
    dependentFields: [
      // no updates, all possible values are OK
    ],
  },
  {
    prevValue: '1:many',
    nextValue: 'n:n',
    dependentFields: [
      {
        name: 'changeTip',
        prevValue: 'perSource',
        nextValue: 'always',
      },
      {
        name: 'changeTip',
        prevValue: 'perDest',
        nextValue: 'always',
      },
      {
        name: 'path',
        prevValue: 'multiDispense',
        nextValue: 'single',
      },
    ],
  },
  {
    prevValue: '1:many',
    nextValue: 'many:1',
    dependentFields: [
      {
        name: 'changeTip',
        prevValue: 'perSource',
        nextValue: 'always',
      },
      {
        name: 'changeTip',
        prevValue: 'perDest',
        nextValue: 'always',
      },
      {
        name: 'path',
        prevValue: 'multiDispense',
        nextValue: 'single',
      },
    ],
  },
  {
    prevValue: 'many:1',
    nextValue: 'n:n',
    dependentFields: [
      {
        name: 'path',
        prevValue: 'multiAspirate',
        nextValue: 'single',
      },
    ],
  },
  {
    prevValue: 'many:1',
    nextValue: '1:many',
    dependentFields: [
      {
        name: 'changeTip',
        prevValue: 'perSource',
        nextValue: 'always',
      },
      {
        name: 'path',
        prevValue: 'multiAspirate',
        nextValue: 'single',
      },
    ],
  },
]
const wellRatioUpdater = makeConditionalPatchUpdater(wellRatioUpdatesMap)
export function updatePatchPathField(
  patch: FormPatch,
  rawForm: FormData,
  pipetteEntities: PipetteEntities
): FormPatch {
  const { id, stepType, ...stepData } = rawForm
  const appliedPatch = { ...(stepData as FormPatch), ...patch }
  const { path, changeTip } = appliedPatch

  if (!path) {
    // invalid well ratio - fall back to 'single'
    return { ...patch, path: 'single' }
  }

  let pipetteCapacityExceeded = false

  if (
    appliedPatch.volume &&
    typeof appliedPatch.pipette === 'string' &&
    appliedPatch.pipette in pipetteEntities
  ) {
    pipetteCapacityExceeded = !volumeInCapacityForMulti(
      // @ts-expect-error(sa, 2021-6-14): appliedPatch is not of type FormData, address in #3161
      appliedPatch,
      pipetteEntities
    )
  }

  // changeTip value incompatible with next path value
  const incompatiblePath =
    (changeTip === 'perSource' && path === 'multiAspirate') ||
    (changeTip === 'perDest' && path === 'multiDispense')

  if (pipetteCapacityExceeded || incompatiblePath) {
    return { ...patch, path: 'single' }
  }

  return patch
}

const updatePatchOnLabwareChange = (
  patch: FormPatch,
  rawForm: FormData,
  labwareEntities: LabwareEntities,
  pipetteEntities: PipetteEntities
): FormPatch => {
  const sourceLabwareChanged = fieldHasChanged(
    rawForm,
    patch,
    'aspirate_labware'
  )
  const destLabwareChanged = fieldHasChanged(rawForm, patch, 'dispense_labware')
  if (!sourceLabwareChanged && !destLabwareChanged) return patch
  const { id, stepType, ...stepData } = rawForm
  const appliedPatch = { ...(stepData as FormPatch), ...patch, id, stepType }
  // @ts-expect-error(sa, 2021-6-14): appliedPatch.pipette is type ?unknown. Address in #3161
  const pipetteId: string = appliedPatch.pipette
  const sourceLabwarePatch: FormPatch = sourceLabwareChanged
    ? {
        ...getDefaultFields(
          'aspirate_mmFromBottom',
          'aspirate_touchTip_mmFromBottom'
        ),
        aspirate_wells: getDefaultWells({
          // @ts-expect-error(sa, 2021-6-14): appliedPatch.pipette is type ?unknown. Address in #3161
          labwareId: appliedPatch.aspirate_labware,
          pipetteId,
          labwareEntities,
          pipetteEntities,
        }),
      }
    : {}
  const destLabwarePatch: FormPatch = destLabwareChanged
    ? {
        ...getDefaultFields(
          'dispense_mmFromBottom',
          'dispense_touchTip_mmFromBottom'
        ),
        dispense_wells: getDefaultWells({
          // @ts-expect-error(sa, 2021-6-14): appliedPatch.pipette is type ?unknown. Address in #3161
          labwareId: appliedPatch.dispense_labware,
          pipetteId,
          labwareEntities,
          pipetteEntities,
        }),
      }
    : {}
  return { ...sourceLabwarePatch, ...destLabwarePatch }
}

const updatePatchOnPipetteChange = (
  patch: FormPatch,
  rawForm: FormData,
  pipetteEntities: PipetteEntities
): FormPatch => {
  // when pipette ID is changed (to another ID, or to null),
  // set any flow rates, mix volumes, or disposal volumes to null
  // and set air gap volume to default (= pipette minimum)
  if (fieldHasChanged(rawForm, patch, 'pipette')) {
    const newPipette = patch.pipette
    let airGapVolume: string | null = null

    if (typeof newPipette === 'string' && newPipette in pipetteEntities) {
      const pipetteSpec = pipetteEntities[newPipette].spec
      airGapVolume = `${pipetteSpec.minVolume}`
    }

    return {
      ...patch,
      ...getDefaultFields(
        'aspirate_flowRate',
        'dispense_flowRate',
        'aspirate_mix_volume',
        'dispense_mix_volume',
        'disposalVolume_volume',
        'aspirate_mmFromBottom',
        'dispense_mmFromBottom'
      ),
      aspirate_airGap_volume: airGapVolume,
      dispense_airGap_volume: airGapVolume,
    }
  }

  return patch
}

const getClearedDisposalVolumeFields = (): FormPatch =>
  getDefaultFields('disposalVolume_volume', 'disposalVolume_checkbox')

const clampAspirateAirGapVolume = (
  patch: FormPatch,
  rawForm: FormData,
  pipetteEntities: PipetteEntities
): FormPatch => {
  const patchedAspirateAirgapVolume =
    patch.aspirate_airGap_volume ?? rawForm?.aspirate_airGap_volume
  const pipetteId = patch.pipette ?? rawForm.pipette

  if (
    patchedAspirateAirgapVolume &&
    typeof pipetteId === 'string' &&
    pipetteId in pipetteEntities
  ) {
    const pipetteEntity = pipetteEntities[pipetteId]
    const minPipetteVolume = getMinPipetteVolume(pipetteEntity)
    const minAirGapVolume = 0 // NOTE: a form level warning will occur if the air gap volume is below the pipette min volume

    const maxAirGapVolume = getPipetteCapacity(pipetteEntity) - minPipetteVolume
    const clampedAirGapVolume = clamp(
      Number(patchedAspirateAirgapVolume),
      minAirGapVolume,
      maxAirGapVolume
    )
    if (clampedAirGapVolume === Number(patchedAspirateAirgapVolume))
      return patch
    return { ...patch, aspirate_airGap_volume: String(clampedAirGapVolume) }
  }

  return patch
}

const clampDispenseAirGapVolume = (
  patch: FormPatch,
  rawForm: FormData,
  pipetteEntities: PipetteEntities
): FormPatch => {
  const { id, stepType, ...stepData } = rawForm
  const appliedPatch = { ...(stepData as FormPatch), ...patch, id, stepType }
  // @ts-expect-error(sa, 2021-6-14): appliedPatch.pipette does not exist. Address in #3161
  const pipetteId: string = appliedPatch.pipette
  // @ts-expect-error(sa, 2021-6-14): appliedPatch.disposalVolume_checkbox does not exist. Address in #3161
  const disposalVolume = appliedPatch.disposalVolume_checkbox
    ? // @ts-expect-error(sa, 2021-6-14): appliedPatch.disposalVolume_volume does not exist. Address in #3161
      Number(appliedPatch.disposalVolume_volume) || 0
    : 0
  // @ts-expect-error(sa, 2021-6-14): appliedPatch.volume does not exist. Address in #3161
  const transferVolume = Number(appliedPatch.volume)
  // @ts-expect-error(sa, 2021-6-14): appliedPatch.dispense_airGap_volume does not exist. Address in #3161
  const dispenseAirGapVolume = Number(appliedPatch.dispense_airGap_volume)

  if (
    // @ts-expect-error(sa, 2021-6-14): appliedPatch.dispense_airGap_volume does not exist. Address in #3161
    appliedPatch.dispense_airGap_volume &&
    typeof pipetteId === 'string' &&
    pipetteId in pipetteEntities
  ) {
    const pipetteEntity = pipetteEntities[pipetteId]
    const capacity = getPipetteCapacity(pipetteEntity)
    const minAirGapVolume = 0 // NOTE: a form level warning will occur if the air gap volume is below the pipette min volume

    const maxAirGapVolume =
      // @ts-expect-error(sa, 2021-6-14): appliedPatch.path does not exist. Address in #3161
      appliedPatch.path === 'multiDispense'
        ? capacity - disposalVolume - transferVolume
        : capacity
    const clampedAirGapVolume = clamp(
      dispenseAirGapVolume,
      minAirGapVolume,
      maxAirGapVolume
    )
    if (clampedAirGapVolume === dispenseAirGapVolume) return patch
    return { ...patch, dispense_airGap_volume: String(clampedAirGapVolume) }
  }

  return patch
}

const updatePatchDisposalVolumeFields = (
  patch: FormPatch,
  rawForm: FormData,
  pipetteEntities: PipetteEntities
): FormPatch => {
  const { id, stepType, ...stepData } = rawForm
  const appliedPatch = { ...(stepData as FormPatch), ...patch, id, stepType }
  const pathChangedFromMultiDispense =
    patch.path &&
    patch.path !== 'multiDispense' &&
    rawForm.path === 'multiDispense'

  if (pathChangedFromMultiDispense || patch.disposalVolume_checkbox === false) {
    // clear disposal volume whenever path is changed from multiDispense
    // or whenever disposalVolume_checkbox is cleared
    return { ...patch, ...getClearedDisposalVolumeFields() }
  }

  const shouldReinitializeDisposalVolume =
    (patch.path === 'multiDispense' && rawForm.path !== 'multiDispense') ||
    (patch.pipette && patch.pipette !== rawForm.pipette) ||
    patch.disposalVolume_checkbox

  if (
    shouldReinitializeDisposalVolume &&
    // @ts-expect-error(sa, 2021-6-14): appliedPatch.pipette does not exist. Address in #3161
    typeof appliedPatch.pipette === 'string'
  ) {
    // @ts-expect-error(sa, 2021-6-14): appliedPatch.pipette does not exist. Address in #3161
    const pipetteEntity = pipetteEntities[appliedPatch.pipette]
    const pipetteSpec = getPipetteNameSpecs(pipetteEntity.name)
    const recommendedMinimumDisposalVol =
      (pipetteSpec && pipetteSpec.minVolume) || 0
    // reset to recommended vol. Expects `clampDisposalVolume` to reduce it if needed
    return {
      ...patch,
      disposalVolume_checkbox: true,
      disposalVolume_volume: String(recommendedMinimumDisposalVol || 0),
    }
  }

  return patch
}

// clamp disposal volume so it cannot be negative, or exceed the capacity for multiDispense
// also rounds it to acceptable digits before clamping
const clampDisposalVolume = (
  patch: FormPatch,
  rawForm: FormData,
  pipetteEntities: PipetteEntities
): FormPatch => {
  const { id, stepType, ...stepData } = rawForm
  const appliedPatch = { ...(stepData as FormPatch), ...patch, id, stepType }
  // @ts-expect-error(sa, 2021-6-14): appliedPatch isn't well-typed, address in #3161
  const isDecimalString = appliedPatch.disposalVolume_volume === '.'
  // @ts-expect-error(sa, 2021-6-14): appliedPatch isn't well-typed, address in #3161
  if (appliedPatch.path !== 'multiDispense' || isDecimalString) return patch
  const maxDisposalVolume = getMaxDisposalVolumeForMultidispense(
    // @ts-expect-error(sa, 2021-6-14): appliedPatch isn't well-typed, address in #3161
    appliedPatch,
    pipetteEntities
  )

  if (maxDisposalVolume == null) {
    assert(
      false,
      `clampDisposalVolume got null maxDisposalVolume for pipette, something weird happened`
    )
    return patch
  }
  // @ts-expect-error(sa, 2021-6-14): appliedPatch.disposalVolume_volume does not exist. Address in #3161
  const candidateDispVolNum = Number(appliedPatch.disposalVolume_volume)
  const nextDisposalVolume = clamp(
    round(candidateDispVolNum, DISPOSAL_VOL_DIGITS),
    0,
    maxDisposalVolume
  )

  if (nextDisposalVolume === candidateDispVolNum) {
    // this preserves decimals
    return patch
  }

  if (nextDisposalVolume > 0) {
    return { ...patch, disposalVolume_volume: String(nextDisposalVolume) }
  }

  // clear out if path is new, or set to zero/null depending on checkbox
  return rawForm.path === 'multiDispense'
    ? {
        ...patch,
        // @ts-expect-error(sa, 2021-6-14): appliedPatch.disposalVolume_checkbox does not exist. Address in #3161
        disposalVolume_volume: appliedPatch.disposalVolume_checkbox
          ? '0'
          : null,
      }
    : { ...patch, ...getClearedDisposalVolumeFields() }
}

const updatePatchOnPipetteChannelChange = (
  patch: FormPatch,
  rawForm: FormData,
  labwareEntities: LabwareEntities,
  pipetteEntities: PipetteEntities
): FormPatch => {
  if (patch.pipette === undefined) return patch
  let update: FormPatch = {}
  const prevChannels = getChannels(rawForm.pipette, pipetteEntities)
  const nextChannels =
    typeof patch.pipette === 'string'
      ? getChannels(patch.pipette, pipetteEntities)
      : null
  const { id, stepType, ...stepData } = rawForm
  const appliedPatch = { ...(stepData as FormPatch), ...patch, id, stepType }
  const singleToMulti =
    prevChannels === 1 && (nextChannels === 8 || nextChannels === 96)
  const multiToSingle =
    (prevChannels === 8 || prevChannels === 96) && nextChannels === 1

  if (patch.pipette === null || singleToMulti) {
    // reset all well selection
    // @ts-expect-error(sa, 2021-6-14): appliedPatch.pipette does not exist. Address in #3161
    const pipetteId: string = appliedPatch.pipette
    update = {
      aspirate_wells: getDefaultWells({
        // @ts-expect-error(sa, 2021-6-14): appliedPatch.aspirate_labware does not exist. Address in #3161
        labwareId: appliedPatch.aspirate_labware,
        pipetteId,
        labwareEntities,
        pipetteEntities,
      }),
      dispense_wells: getDefaultWells({
        // @ts-expect-error(sa, 2021-6-14): appliedPatch.dispense_labware does not exist. Address in #3161
        labwareId: appliedPatch.dispense_labware,
        pipetteId,
        labwareEntities,
        pipetteEntities,
      }),
    }
  } else if (multiToSingle) {
    let channels = 8
    if (prevChannels === 96) {
      channels = 96
    }
    // multi-channel to single-channel: convert primary wells to all wells
    // @ts-expect-error(sa, 2021-06-14): appliedPatch.aspirate_labware is type ?unknown. Address in #3161
    const sourceLabwareId: string = appliedPatch.aspirate_labware
    // @ts-expect-error(sa, 2021-06-14): appliedPatch.dispense_labware is type ?unknown. Address in #3161
    const destLabwareId: string = appliedPatch.dispense_labware
    const sourceLabware = sourceLabwareId && labwareEntities[sourceLabwareId]
    const sourceLabwareDef = sourceLabware && sourceLabware.def
    const destLabware = destLabwareId && labwareEntities[destLabwareId]
    const destLabwareDef = destLabware && destLabware.def
    update = {
      aspirate_wells: getAllWellsFromPrimaryWells(
        // @ts-expect-error(sa, 2021-06-14): appliedPatch.aspirate_wells is type ?unknown. Address in #3161
        appliedPatch.aspirate_wells, // @ts-expect-error(sa, 2021-06-14): sourceLabwareDef is not typed properly. Address in #3161
        sourceLabwareDef,
        channels
      ),
      dispense_wells: getAllWellsFromPrimaryWells(
        // @ts-expect-error(sa, 2021-06-14): appliedPatch.dispense_wells is type ?unknown. Address in #3161
        appliedPatch.dispense_wells, // @ts-expect-error(sa, 2021-06-14): destLabwareDef is not typed properly. Address in #3161
        destLabwareDef,
        channels
      ),
    }
  }

  return { ...patch, ...update }
}

function updatePatchOnWellRatioChange(
  patch: FormPatch,
  rawForm: FormData
): FormPatch {
  const appliedPatch = { ...rawForm, ...patch }
  const prevWellRatio = getWellRatio(
    rawForm.aspirate_wells,
    rawForm.dispense_wells
  )
  const nextWellRatio = getWellRatio(
    appliedPatch.aspirate_wells,
    appliedPatch.dispense_wells
  )

  if (!nextWellRatio || !prevWellRatio) {
    // selected invalid well combo (eg 2:3, 0:1, etc). Reset path to 'single' and reset changeTip if invalid
    const resetChangeTip = ['perSource', 'perDest'].includes(
      appliedPatch.changeTip
    )
    const resetPath = { ...patch, path: 'single' }
    return resetChangeTip ? { ...resetPath, changeTip: 'always' } : resetPath
  }

  if (nextWellRatio === prevWellRatio) return patch
  return {
    ...patch,
    ...(wellRatioUpdater(
      prevWellRatio,
      nextWellRatio,
      appliedPatch
    ) as FormPatch),
  }
}

function updatePatchMixFields(patch: FormPatch, rawForm: FormData): FormPatch {
  if (patch.path) {
    if (patch.path === 'multiAspirate') {
      return {
        ...patch,
        ...getDefaultFields(
          'aspirate_mix_checkbox',
          'aspirate_mix_times',
          'aspirate_mix_volume'
        ),
      }
    }

    if (patch.path === 'multiDispense') {
      return {
        ...patch,
        ...getDefaultFields(
          'dispense_mix_checkbox',
          'dispense_mix_times',
          'dispense_mix_volume'
        ),
      }
    }
  }

  return patch
}

export function updatePatchBlowoutFields(
  patch: FormPatch,
  rawForm: FormData
): FormPatch {
  const { id, stepType, ...stepData } = rawForm
  const appliedPatch = { ...(stepData as FormPatch), ...patch, id, stepType }

  if (fieldHasChanged(rawForm, patch, 'path')) {
    // @ts-expect-error(sa, 2021-06-14): appliedPatch.blowout_location does not exist. Address in #3161
    const { path, blowout_location } = appliedPatch
    // reset blowout_location when path changes to avoid invalid location for path
    // or reset whenever checkbox is toggled
    const shouldResetBlowoutLocation =
      (path === 'multiAspirate' &&
        blowout_location === SOURCE_WELL_BLOWOUT_DESTINATION) ||
      (path === 'multiDispense' &&
        blowout_location === DEST_WELL_BLOWOUT_DESTINATION)

    if (shouldResetBlowoutLocation) {
      return { ...patch, ...getDefaultFields('blowout_location') }
    }
  }

  return patch
}
export function dependentFieldsUpdateMoveLiquid(
  originalPatch: FormPatch,
  rawForm: FormData, // raw = NOT hydrated
  pipetteEntities: PipetteEntities,
  labwareEntities: LabwareEntities
): FormPatch {
  // sequentially modify parts of the patch until it's fully updated
  return chainPatchUpdaters(originalPatch, [
    chainPatch =>
      updatePatchOnLabwareChange(
        chainPatch,
        rawForm,
        labwareEntities,
        pipetteEntities
      ),
    chainPatch =>
      updatePatchOnPipetteChannelChange(
        chainPatch,
        rawForm,
        labwareEntities,
        pipetteEntities
      ),
    chainPatch =>
      updatePatchOnPipetteChange(chainPatch, rawForm, pipetteEntities),
    chainPatch => updatePatchOnWellRatioChange(chainPatch, rawForm),
    chainPatch => updatePatchPathField(chainPatch, rawForm, pipetteEntities),
    chainPatch =>
      updatePatchDisposalVolumeFields(chainPatch, rawForm, pipetteEntities),
    chainPatch =>
      clampAspirateAirGapVolume(chainPatch, rawForm, pipetteEntities),
    chainPatch => clampDisposalVolume(chainPatch, rawForm, pipetteEntities),
    chainPatch => updatePatchMixFields(chainPatch, rawForm),
    chainPatch => updatePatchBlowoutFields(chainPatch, rawForm),
    chainPatch =>
      clampDispenseAirGapVolume(chainPatch, rawForm, pipetteEntities),
  ])
}
