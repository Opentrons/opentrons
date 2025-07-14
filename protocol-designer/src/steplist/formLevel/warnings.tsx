import {
  getAllLiquidClassDefs,
  getFlexNameConversion,
  getWellTotalVolume,
  OT2_PIPETTES,
} from '@opentrons/shared-data'

import { MINIMUM_LIQUID_CLASS_VOLUME } from '../../constants'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { PathOption } from '@opentrons/step-generation'
import type {
  HydratedFormData,
  HydratedMixFormData,
  HydratedMoveLiquidFormData,
} from '../../form-types'
import type { FormError } from './errors'

/*******************
 ** Warning Messages **
 ********************/

export type FormWarningType =
  | 'BELOW_MIN_DISPOSAL_VOLUME'
  | 'BELOW_PIPETTE_MINIMUM_VOLUME'
  | 'INCOMPATIBLE_ALL_PIPETTE'
  | 'INCOMPATIBLE_PIPETTE_PATH'
  | 'INCOMPATIBLE_SOME_PIPETTE'
  | 'INCOMPATIBLE_TIP_RACK_ALL'
  | 'INCOMPATIBLE_TIP_RACK_SOME'
  | 'LOW_VOLUME_TRANSFER'
  | 'MIX_TIP_POSITIONED_LOW_IN_TUBE'
  | 'OVER_MAX_WELL_VOLUME'
  | 'TIP_POSITIONED_LOW_IN_TUBE'
export type FormWarning = FormError & {
  type: FormWarningType
}

const belowPipetteMinVolumeWarning = (min: number): FormWarning => ({
  type: 'BELOW_PIPETTE_MINIMUM_VOLUME',
  title: `Disposal volume is below recommended minimum (${min} uL)`,
  body:
    'For accuracy in multi-dispense Transfers we recommend you use a disposal volume of at least the pipette`s minimum.',
  dependentFields: ['pipette', 'volume'],
  location: 'form',
})

const overMaxWellVolumeWarning = (): FormWarning => ({
  type: 'OVER_MAX_WELL_VOLUME',
  title: 'Dispense volume will overflow a destination well',
  dependentFields: ['dispense_labware', 'dispense_wells', 'volume'],
  location: 'form',
})

const belowMinDisposalVolumeWarning = (min: number): FormWarning => ({
  type: 'BELOW_MIN_DISPOSAL_VOLUME',
  title: `Disposal volume is below recommended minimum (${min} uL)`,
  body:
    'For accuracy in multi-dispense Transfers we recommend you use a disposal volume of at least the pipette`s minimum.',
  dependentFields: ['disposalVolume_volume', 'pipette'],
  location: 'form',
})

const tipPositionedLowInTube = (): FormWarning => ({
  type: 'TIP_POSITIONED_LOW_IN_TUBE',
  title:
    'A tuberack has an aspirate and dispense default height at 1mm from the bottom of the well, which could cause liquid overflow or pipette damage. Edit tip position in advanced settings.',
  dependentFields: ['aspirate_labware', 'dispense_labware'],
  location: 'form',
})

const mixTipPositionedLowInTube = (): FormWarning => ({
  type: 'MIX_TIP_POSITIONED_LOW_IN_TUBE',
  title:
    'The default mix height is 1mm from the bottom of the well, which could cause liquid overflow or pipette damage. Edit tip position in advanced settings.',
  dependentFields: ['labware'],
  location: 'form',
})

/*******************
 ** Warning Checkers **
 ********************/

export const tipPositionInTube = (
  fields: HydratedMoveLiquidFormData
): FormWarning | null => {
  const {
    aspirate_labware,
    aspirate_mmFromBottom,
    dispense_labware,
    dispense_mmFromBottom,
  } = fields
  let isAspirateTubeRack: boolean = false
  let isDispenseTubeRack: boolean = false
  if (aspirate_labware != null) {
    isAspirateTubeRack =
      aspirate_labware.def.metadata.displayCategory === 'tubeRack'
  }
  if (dispense_labware != null) {
    isDispenseTubeRack =
      // checking that the dispense labware is a labware and not a trash/waste chute
      'def' in dispense_labware
        ? dispense_labware.def.metadata.displayCategory === 'tubeRack'
        : false
  }

  if (
    (isAspirateTubeRack && aspirate_mmFromBottom === null) ||
    (isDispenseTubeRack && dispense_mmFromBottom === null)
  ) {
    return tipPositionedLowInTube()
  } else {
    return null
  }
}

export const mixTipPositionInTube = (
  fields: HydratedMixFormData
): FormWarning | null => {
  const { labware, mix_mmFromBottom } = fields
  let isTubeRack: boolean = false
  if (labware != null) {
    isTubeRack = labware.def.metadata.displayCategory === 'tubeRack'
  }
  return isTubeRack && mix_mmFromBottom === 0.5
    ? mixTipPositionedLowInTube()
    : null
}
export const belowPipetteMinimumVolume = (
  fields: HydratedMixFormData | HydratedMoveLiquidFormData
): FormWarning | null => {
  const { pipette, volume } = fields
  if (!(pipette && pipette.spec)) return null
  const liquidSpecs = pipette.spec.liquids
  const minVolume =
    'lowVolumeDefault' in liquidSpecs
      ? liquidSpecs.lowVolumeDefault.minVolume
      : liquidSpecs.default.minVolume
  return volume < minVolume
    ? belowPipetteMinVolumeWarning(minVolume as number)
    : null
}

export const maxDispenseWellVolume = (
  fields: HydratedMoveLiquidFormData
): FormWarning | null => {
  const { aspirate_wells, dispense_labware, dispense_wells, volume } = fields
  if (!dispense_labware || !dispense_wells) {
    return null
  }

  const isManyToOne = aspirate_wells.length > dispense_wells.length
  const effectiveVolume = isManyToOne ? volume * aspirate_wells.length : volume
  const hasExceeded = dispense_wells.some((well: string) => {
    const maximum =
      'def' in dispense_labware
        ? getWellTotalVolume(dispense_labware.def as LabwareDefinition2, well)
        : Infinity
    return maximum && effectiveVolume > maximum
  })
  return hasExceeded ? overMaxWellVolumeWarning() : null
}

export const minDisposalVolume = (
  fields: HydratedMoveLiquidFormData
): FormWarning | null => {
  const {
    disposalVolume_checkbox,
    disposalVolume_volume,
    pipette,
    path,
  } = fields
  if (!(pipette && pipette.spec) || path !== 'multiDispense') return null
  const isUnselected = !disposalVolume_checkbox || !disposalVolume_volume
  const liquidSpecs = pipette.spec.liquids
  const minVolume =
    'lowVolumeDefault' in liquidSpecs
      ? liquidSpecs.lowVolumeDefault.minVolume
      : liquidSpecs.default.minVolume
  if (isUnselected) {
    return belowMinDisposalVolumeWarning(minVolume as number)
  }
  const isBelowMin = disposalVolume_volume < minVolume
  return isBelowMin ? belowMinDisposalVolumeWarning(minVolume as number) : null
}

export const _lowVolumeTransferWarning = (): FormWarning => ({
  type: 'LOW_VOLUME_TRANSFER',
  title: `Transfer volumes of ${MINIMUM_LIQUID_CLASS_VOLUME} µL or less are incompatible with liquid classes.`,
  dependentFields: ['volume'],
  location: 'form',
})

export const _incompatiblePipettePathWarning = (): FormWarning => ({
  type: 'INCOMPATIBLE_PIPETTE_PATH',
  title: 'The selected pipette path is incompatible with some liquid classes.',
  dependentFields: ['path', 'pipette', 'tipRack'],
  location: 'form',
})

export const _incompatibleAllPipetteWarning = (): FormWarning => ({
  type: 'INCOMPATIBLE_ALL_PIPETTE',
  title: `The selected pipette is incompatible with liquid classes.`,
  dependentFields: ['pipette', 'tipRack'],
  location: 'form',
})

export const _incompatibleSomePipetteWarning = (): FormWarning => ({
  type: 'INCOMPATIBLE_SOME_PIPETTE',
  title: `The selected pipette is incompatible with some liquid classes.`,
  dependentFields: ['pipette', 'tipRack'],
  location: 'form',
})

export const _incompatibleAllTipRackWarning = (): FormWarning => ({
  type: 'INCOMPATIBLE_TIP_RACK_ALL',
  title: `The selected tiprack is incompatible with all liquid classes.`,
  dependentFields: ['pipette', 'tipRack'],
  location: 'form',
})

export const _incompatibleSomeTipRackWarning = (): FormWarning => ({
  type: 'INCOMPATIBLE_TIP_RACK_SOME',
  title: `The selected tiprack is incompatible with some liquid classes.`,
  dependentFields: ['pipette', 'tipRack'],
  location: 'form',
})

enum ReasonForWarning {
  PipetteAll = 'PIPETTE_ALL',
  PipetteSome = 'PIPETTE_SOME',
  TipRackAll = 'TIP_RACK_ALL',
  TipRackSome = 'TIP_RACK_SOME',
  Volume = 'VOLUME',
  Path = 'PATH',
}
const priorityMap: Record<ReasonForWarning, number> = {
  [ReasonForWarning.PipetteAll]: 0,
  [ReasonForWarning.TipRackAll]: 1,
  [ReasonForWarning.PipetteSome]: 2,
  [ReasonForWarning.TipRackSome]: 3,
  [ReasonForWarning.Volume]: 4,
  [ReasonForWarning.Path]: 5,
}
const mappedLiquidClassReasonToWarning: Record<
  ReasonForWarning,
  () => FormWarning
> = {
  [ReasonForWarning.PipetteAll]: _incompatibleAllPipetteWarning,
  [ReasonForWarning.PipetteSome]: _incompatibleSomePipetteWarning,
  [ReasonForWarning.TipRackAll]: _incompatibleAllTipRackWarning,
  [ReasonForWarning.TipRackSome]: _incompatibleSomeTipRackWarning,
  [ReasonForWarning.Volume]: _lowVolumeTransferWarning,
  [ReasonForWarning.Path]: _incompatiblePipettePathWarning,
}
export const incompatibleLiquidClass: (
  fields: HydratedMoveLiquidFormData | HydratedMixFormData
) => FormWarning | null = formData => {
  const { pipette, tipRack, volume: rawVolume } = formData
  if (pipette == null || tipRack == null) {
    return null
  }
  // don't show warnings for OT-2
  const isOT2 = Object.values(OT2_PIPETTES).includes(pipette.name)
  if (isOT2) {
    return null
  }
  const liquidClasses = getAllLiquidClassDefs()
  const pipetteName = getFlexNameConversion(pipette.spec)
  const volume = Number(rawVolume)
  const path = 'path' in formData ? (formData.path as PathOption) : null

  let reasonForWarning: ReasonForWarning | null = null
  let numIncompatibleLiquidClassesForPipette = 0
  let numIncompatibleLiquidClassesForTiprack = 0
  const updatedReasonForWarning = (newReason: ReasonForWarning): void => {
    if (
      reasonForWarning == null ||
      priorityMap[newReason] < priorityMap[reasonForWarning]
    ) {
      reasonForWarning = newReason
    }
  }
  Object.values(liquidClasses).forEach(liquidClass => {
    const pipetteObject = liquidClass.byPipette.find(
      ({ pipetteModel }) => pipetteModel === pipetteName
    )
    if (pipetteObject == null) {
      updatedReasonForWarning(ReasonForWarning.PipetteSome)
      numIncompatibleLiquidClassesForPipette += 1
      return
    }

    const tipRackObject = pipetteObject.byTipType.find(
      ({ tiprack }) => tiprack === tipRack
    )

    if (tipRackObject == null) {
      updatedReasonForWarning(ReasonForWarning.TipRackSome)
      numIncompatibleLiquidClassesForTiprack += 1
      return
    }
    if (path === 'multiDispense' && !('multiDispense' in tipRackObject)) {
      updatedReasonForWarning(ReasonForWarning.Path)
    }
  })

  if (volume < MINIMUM_LIQUID_CLASS_VOLUME) {
    updatedReasonForWarning(ReasonForWarning.Volume)
  }

  const numLiquidClasses = Object.keys(liquidClasses).length
  if (numIncompatibleLiquidClassesForPipette === numLiquidClasses) {
    reasonForWarning = ReasonForWarning.PipetteAll
  } else if (numIncompatibleLiquidClassesForTiprack === numLiquidClasses) {
    reasonForWarning = ReasonForWarning.TipRackAll
  }

  return reasonForWarning != null
    ? mappedLiquidClassReasonToWarning[reasonForWarning]()
    : null
}

/*******************
 **     Helpers    **
 ********************/

type ComposeWarnings = <T extends HydratedFormData>(
  ...warningCheckers: Array<(fields: T) => FormWarning | null>
) => (arg: T) => FormWarning[]

export const composeWarnings: ComposeWarnings = <T extends HydratedFormData>(
  ...warningCheckers: Array<(fields: T) => FormWarning | null>
) => (formData: T) =>
  warningCheckers.reduce<FormWarning[]>((acc, checker) => {
    const possibleWarning = checker(formData)
    return possibleWarning ? [...acc, possibleWarning] : acc
  }, [])
