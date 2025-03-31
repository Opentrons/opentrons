import {
  isFlexPipette,
  getAllLiquidClassDefs,
  getIncompatibleLiquidClasses,
  getWellTotalVolume,
  MIN_LIQUID_CLASSES_COMPATIBLE_VOLUME,
} from '@opentrons/shared-data'
import type {
  LabwareDefinition2,
  PipetteName,
  PipetteV2Specs,
} from '@opentrons/shared-data'
import { getFlexNameConversion } from '@opentrons/step-generation'
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
  | 'BELOW_MIN_AIR_GAP_VOLUME'
  | 'BELOW_MIN_DISPOSAL_VOLUME'
  | 'BELOW_PIPETTE_MINIMUM_VOLUME'
  | 'OVER_MAX_WELL_VOLUME'
  | 'MIX_TIP_POSITIONED_LOW_IN_TUBE'
  | 'TIP_POSITIONED_LOW_IN_TUBE'
  | 'LOW_VOLUME_TRANSFER'
  | 'INCOMPATIBLE_PIPETTE_PATH'
  | 'INCOMPATIBLE_ALL_PIPETTE_LABWARE'
  | 'INCOMPATIBLE_SOME_PIPETTE_LABWARE'

export type FormWarning = FormError & {
  type: FormWarningType
}

const belowMinAirGapVolumeWarning = (min: number): FormWarning => ({
  type: 'BELOW_MIN_AIR_GAP_VOLUME',
  title: `Air gap volume is below pipette minimum (${min} uL)`,
  body: <>{'Pipettes cannot accurately handle volumes below their minimum.'}</>,
  dependentFields: ['disposalVolume_volume', 'pipette'],
})

const belowPipetteMinVolumeWarning = (min: number): FormWarning => ({
  type: 'BELOW_PIPETTE_MINIMUM_VOLUME',
  title: `Disposal volume is below recommended minimum (${min} uL)`,
  body:
    'For accuracy in multi-dispense Transfers we recommend you use a disposal volume of at least the pipette`s minimum.',
  dependentFields: ['pipette', 'volume'],
})

const overMaxWellVolumeWarning = (): FormWarning => ({
  type: 'OVER_MAX_WELL_VOLUME',
  title: 'Dispense volume will overflow a destination well',
  dependentFields: ['dispense_labware', 'dispense_wells', 'volume'],
})

const belowMinDisposalVolumeWarning = (min: number): FormWarning => ({
  type: 'BELOW_MIN_DISPOSAL_VOLUME',
  title: `Disposal volume is below recommended minimum (${min} uL)`,
  body:
    'For accuracy in multi-dispense Transfers we recommend you use a disposal volume of at least the pipette`s minimum.',
  dependentFields: ['disposalVolume_volume', 'pipette'],
})

const tipPositionedLowInTube = (): FormWarning => ({
  type: 'TIP_POSITIONED_LOW_IN_TUBE',
  title:
    'A tuberack has an aspirate and dispense default height at 1mm from the bottom of the well, which could cause liquid overflow or pipette damage. Edit tip position in advanced settings.',
  dependentFields: ['aspirate_labware', 'dispense_labware'],
})

const mixTipPositionedLowInTube = (): FormWarning => ({
  type: 'MIX_TIP_POSITIONED_LOW_IN_TUBE',
  title:
    'The default mix height is 1mm from the bottom of the well, which could cause liquid overflow or pipette damage. Edit tip position in advanced settings.',
  dependentFields: ['labware'],
})

const lowVolumeTransferWarning = (): FormWarning => ({
  type: 'LOW_VOLUME_TRANSFER',
  title:
    'Transfer volumes of 10 µL or less are incompatible with liquid classes.',
  dependentFields: ['volume'],
})

const incompatiblePipettePathWarning = (): FormWarning => ({
  type: 'INCOMPATIBLE_PIPETTE_PATH',
  title: 'The selected pipette path is incompatible with some liquid classes.',
  dependentFields: ['path', 'pipette', 'tipRack'],
})

const incompatibleAllPipetteLabwareWarning = (type: string): FormWarning => ({
  type: 'INCOMPATIBLE_ALL_PIPETTE_LABWARE',
  title: `The selected ${type} is incompatible with liquid classes.`,
  dependentFields: ['pipette', 'tipRack'],
})

const incompatibleSomePipetteLabwareWarning = (type: string): FormWarning => ({
  type: 'INCOMPATIBLE_SOME_PIPETTE_LABWARE',
  title: `The selected ${type} is incompatible with some liquid classes.`,
  dependentFields: ['pipette', 'tipRack'],
})

export type WarningChecker = (val: unknown) => FormWarning | null

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
  const { dispense_labware, dispense_wells, volume } = fields
  if (!dispense_labware || !dispense_wells) return null
  const hasExceeded = dispense_wells.some((well: string) => {
    const maximum =
      'def' in dispense_labware
        ? getWellTotalVolume(dispense_labware.def as LabwareDefinition2, well)
        : Infinity
    return maximum && volume > maximum
  })
  return hasExceeded ? overMaxWellVolumeWarning() : null
}

export const incompatibleLowVolume = (
  fields: HydratedMixFormData | HydratedMoveLiquidFormData
): FormWarning | null => {
  const { volume } = fields

  return volume <= MIN_LIQUID_CLASSES_COMPATIBLE_VOLUME
    ? lowVolumeTransferWarning()
    : null
}

export const incompatiblePipettePath = (
  fields: HydratedMoveLiquidFormData
): FormWarning | null => {
  const { pipette, tipRack, path } = fields
  if (!pipette) return null
  const pipetteName = pipette.name as PipetteName
  const pipetteModel =
    isFlexPipette(pipetteName) === true
      ? getFlexNameConversion(pipette.spec as PipetteV2Specs)
      : pipetteName

  if (path === 'multiDispense') {
    const incompatiblePath = getIncompatibleLiquidClasses(pipetteModel, p =>
      p.byTipType.some(
        (t: { tiprack: string; multiDispense: any }) =>
          t.tiprack === tipRack && t.multiDispense !== undefined
      )
    )
    return incompatiblePath.length > 0 ? incompatiblePipettePathWarning() : null
  }

  return null
}

export const incompatiblePipetteTiprack = (
  fields: HydratedMixFormData | HydratedMoveLiquidFormData
): FormWarning | null => {
  const { pipette, tipRack } = fields
  const liquidClassDefs = getAllLiquidClassDefs()
  if (!pipette) return null
  const pipetteName = pipette.name as PipetteName

  const pipetteModel =
    isFlexPipette(pipetteName) === true
      ? getFlexNameConversion(pipette.spec as PipetteV2Specs)
      : pipetteName

  const incompatiblePipette = getIncompatibleLiquidClasses(pipetteModel)
  const incompatibleTiprack = getIncompatibleLiquidClasses(pipetteModel, p =>
    p.byTipType.some((t: { tiprack: string }) => t.tiprack === tipRack)
  )

  const liquidClassesCount = Object.keys(liquidClassDefs).length
  console.log(liquidClassesCount)
  const incompatiblePipetteCount = incompatiblePipette.length
  const incompatibleTiprackCount = incompatibleTiprack.length
  if (incompatiblePipetteCount > 0) {
    return incompatiblePipetteCount === liquidClassesCount
      ? incompatibleAllPipetteLabwareWarning('pipette')
      : incompatibleSomePipetteLabwareWarning('pipette')
  } else if (incompatibleTiprackCount > 0) {
    return incompatibleTiprackCount === liquidClassesCount
      ? incompatibleAllPipetteLabwareWarning('tiprack')
      : incompatibleSomePipetteLabwareWarning('tiprack')
  }

  return null
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

// both aspirate and dispense air gap volumes have the same minimums
export const _minAirGapVolume = (
  checkboxField: 'aspirate_airGap_checkbox' | 'dispense_airGap_checkbox',
  volumeField: 'aspirate_airGap_volume' | 'dispense_airGap_volume'
) => (fields: HydratedMoveLiquidFormData): FormWarning | null => {
  const checkboxValue = fields[checkboxField]
  const volumeValue = fields[volumeField]
  const { pipette } = fields
  if (!checkboxValue || !volumeValue || !pipette || !pipette.spec) {
    return null
  }
  const liquidSpecs = pipette.spec.liquids
  const minVolume =
    'lowVolumeDefault' in liquidSpecs
      ? liquidSpecs.lowVolumeDefault.minVolume
      : liquidSpecs.default.minVolume
  const isBelowMin = Number(volumeValue) < minVolume
  return isBelowMin ? belowMinAirGapVolumeWarning(minVolume as number) : null
}

export const minAspirateAirGapVolume: (
  fields: HydratedMoveLiquidFormData
) => FormWarning | null = _minAirGapVolume(
  'aspirate_airGap_checkbox',
  'aspirate_airGap_volume'
)

export const minDispenseAirGapVolume: (
  fields: HydratedMoveLiquidFormData
) => FormWarning | null = _minAirGapVolume(
  'dispense_airGap_checkbox',
  'dispense_airGap_volume'
)

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
