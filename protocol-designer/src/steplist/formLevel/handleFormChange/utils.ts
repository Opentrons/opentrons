import max from 'lodash/max'
import min from 'lodash/min'
import round from 'lodash/round'
import uniq from 'lodash/uniq'

import {
  getAllLiquidClassDefs,
  getFlexNameConversion,
  linearInterpolate,
  NONE_LIQUID_CLASS_NAME,
  OT2_ROBOT_TYPE,
  POSITION_REFERENCE_TOP,
  SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
  WATER_LIQUID_CLASS_NAME,
} from '@opentrons/shared-data'
import {
  DEST_WELL_BLOWOUT_DESTINATION,
  getTransferPlanAndReferenceVolumes,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'

import {
  CHANNELS_MAPPED_TO_MAX_SPEED,
  DEFAULT_MM_OFFSET_FROM_BOTTOM,
} from '../../../constants'
import { getMaxUiFlowRate } from '../../../pages/Designer/ProtocolSteps/StepForm/PipetteFields/utils'
import { getPipetteCapacity } from '../../../pipettes/pipetteData'
import {
  canPipetteUseLabware,
  getDefaultPushOutVolume,
  getMatchingTipLiquidSpecs,
  getWellSetForMultichannel,
} from '../../../utils'
import { getDefaultsForStepType } from '../getDefaultsForStepType'

import type {
  BlowoutProperties,
  ByTipTypeSetting,
  DelayProperties,
  LabwareDefinition2,
  LiquidHandlingPropertyByVolume,
  MixProperties,
  NozzleConfigurationStyle,
  PipetteChannels,
  PositionReference,
  RetractAspirate,
  RetractDispense,
  RobotType,
  Submerge,
  TouchTipProperties,
  Vector3D,
} from '@opentrons/shared-data'
import type {
  AdditionalEquipmentEntities,
  LabwareEntities,
  PipetteEntities,
  PipetteEntity,
  ReferenceVolumes,
} from '@opentrons/step-generation'
import type { LabwareDefByDefURI } from '/protocol-designer/labware-defs'
import type { FormData, PathOption, StepFieldName } from '../../../form-types'
import type {
  FieldPropsByName,
  LiquidHandlingTab,
} from '../../../pages/Designer/ProtocolSteps/StepForm/types'
import type { FormPatch } from '../../actions/types'

type LiquidClassSettingsType = 'aspirate' | 'dispense' | 'all'

const STABLE_FIELDS_BY_FORM_TYPE: Record<'mix' | 'moveLiquid', string[]> = {
  mix: [
    'pipette',
    'tipRack',
    'nozzles',
    'primaryNozzle',
    'labware',
    'wells',
    'volume',
    'times',
    'path',
    'changeTip',
    'dropTip_location',
    'dropTip_wellNames',
    'liquidClass',
    'mix_wellOrder_first',
    'mix_wellOrder_second',
  ],
  moveLiquid: [
    'pipette',
    'tipRack',
    'nozzles',
    'primaryNozzle',
    'aspirate_labware',
    'aspirate_wells',
    'dispense_labware',
    'dispense_wells',
    'volume',
    'path',
    'changeTip',
    'dropTip_location',
    'dropTip_wellNames',
    'liquidClass',
    'aspirate_wellOrder_first',
    'aspirate_wellOrder_second',
  ],
}

export function chainPatchUpdaters(
  initialPatch: FormPatch,
  fns: Array<(arg0: FormPatch) => FormPatch>
): FormPatch {
  return fns.reduce((patchAcc: FormPatch, fn) => {
    return fn(patchAcc)
  }, initialPatch)
}
// given an array of primary wells (for a multichannel), return all unique wells
// included in that set. Used to convert multi to single.
export function getAllWellsFromPrimaryWells(
  primaryWells: string[],
  labwareDef: LabwareDefinition2,
  channels: 8 | 96
): string[] {
  const allWells = primaryWells.reduce((acc: string[], well: string) => {
    const nextWellSet = getWellSetForMultichannel({
      labwareDef,
      wellName: well,
      channels,
    })

    // filter out any nulls (but you shouldn't get any)
    if (!nextWellSet) {
      console.warn(`got empty well set, something weird may be happening`, {
        primaryWells,
        labwareDef,
      })
    }

    return nextWellSet ? [...acc, ...nextWellSet] : acc
  }, [])
  // remove duplicates (eg trough: [A1, A1, A1, A1, A1, A1, A1, A1] -> [A1])
  return uniq(allWells)
}
export function getChannels(
  pipetteId: string,
  pipetteEntities: PipetteEntities
): PipetteChannels | null | undefined {
  const pipette: any | null | undefined = pipetteEntities[pipetteId]

  if (!pipette) {
    return null
  }

  return pipette.spec.channels
}
export const DISPOSAL_VOL_DIGITS = 1
export function getMaxDisposalVolumeForMultiDispense(
  values: {
    aspirate_airGap_checkbox?: boolean | null
    aspirate_airGap_volume?: string | null
    path: PathOption
    pipette: string | null
    volume: string | null
    tipRack?: string | null
  },
  pipetteEntities: PipetteEntities
): number | null | undefined {
  // calculate max disposal volume for given volume & pipette. Might be negative!
  const pipetteId = values?.pipette
  if (!values || !pipetteId) return null
  console.assert(
    values.path === 'multiDispense',
    `getMaxDisposalVolumeForMultidispense expected multiDispense, got path ${values.path}`
  )
  const pipetteEntity = pipetteEntities[pipetteId]
  const pipetteCapacity = getPipetteCapacity(pipetteEntity, values.tipRack)
  const volume = Number(values.volume)
  const airGapChecked = values.aspirate_airGap_checkbox
  let airGapVolume = airGapChecked ? Number(values.aspirate_airGap_volume) : 0
  airGapVolume = Number.isFinite(airGapVolume) ? airGapVolume : 0
  return max([
    round(pipetteCapacity - volume * 2 - airGapVolume, DISPOSAL_VOL_DIGITS),
    0,
  ])
}
// Ensures that 2x volume can fit in pipette
// NOTE: ensuring that disposalVolume_volume will not exceed pipette capacity
// is responsibility of dependentFieldsUpdateMoveLiquid's clamp fn
export function volumeInCapacityForMulti(
  rawForm: FormData,
  pipetteEntities: PipetteEntities
): boolean {
  console.assert(
    rawForm.pipette in pipetteEntities,
    `volumeInCapacityForMulti expected pipette ${rawForm.pipette} to be in pipetteEntities`
  )
  const pipetteEntity = pipetteEntities[rawForm.pipette]
  const pipetteCapacity =
    pipetteEntity &&
    getPipetteCapacity(pipetteEntity, rawForm.tipRack as string)
  const volume = Number(rawForm.volume)
  const airGapChecked = rawForm.aspirate_airGap_checkbox
  let airGapVolume = airGapChecked ? Number(rawForm.aspirate_airGap_volume) : 0
  airGapVolume = Number.isFinite(airGapVolume) ? airGapVolume : 0
  return rawForm.path === 'multiAspirate'
    ? volumeInCapacityForMultiAspirate({
        volume,
        pipetteCapacity,
        airGapVolume,
      })
    : volumeInCapacityForMultiDispense({
        volume,
        pipetteCapacity,
        airGapVolume,
      })
}
export function volumeInCapacityForMultiAspirate(args: {
  volume: number
  pipetteCapacity: number
  airGapVolume: number
}): boolean {
  const { volume, pipetteCapacity, airGapVolume } = args
  return (
    volume > 0 &&
    pipetteCapacity > 0 &&
    volume * 2 + airGapVolume * 2 <= pipetteCapacity
  )
}
export function volumeInCapacityForMultiDispense(args: {
  volume: number
  pipetteCapacity: number
  airGapVolume: number
}): boolean {
  const { volume, pipetteCapacity, airGapVolume } = args

  return (
    volume > 0 &&
    pipetteCapacity > 0 &&
    volume * 2 + airGapVolume <= pipetteCapacity
  )
}
interface GetDefaultWellsArgs {
  labwareId: string | null | undefined
  pipetteId: string | null | undefined
  labwareEntities: LabwareEntities
  pipetteEntities: PipetteEntities
  nozzleConfiguration: NozzleConfigurationStyle
}
export function getDefaultWells(args: GetDefaultWellsArgs): string[] {
  const {
    labwareId,
    pipetteId,
    labwareEntities,
    pipetteEntities,
    nozzleConfiguration,
  } = args
  if (
    !labwareId ||
    !labwareEntities[labwareId] ||
    !pipetteId ||
    !pipetteEntities[pipetteId]
  ) {
    return []
  }
  const labwareDef = labwareEntities[labwareId].def
  const pipetteCanUseLabware = canPipetteUseLabware(
    pipetteEntities[pipetteId].spec,
    nozzleConfiguration,
    labwareDef
  )
  if (!pipetteCanUseLabware) return []
  const isSingleWellLabware =
    labwareDef.ordering.length === 1 && labwareDef.ordering[0].length === 1

  if (isSingleWellLabware) {
    const well = labwareDef.ordering[0][0]
    console.assert(
      well === 'A1',
      `sanity check: expected single-well labware ${labwareId} to have only the well 'A1'`
    )
    return [well]
  }

  return []
}
export function fieldHasChanged(
  rawForm: FormData,
  patch: FormPatch,
  fieldName: StepFieldName
): boolean {
  return Boolean(
    patch[fieldName] !== undefined && patch[fieldName] !== rawForm[fieldName]
  )
}

const getStableFieldsAndValues = (
  stepType: 'mix' | 'moveLiquid',
  rawForm: FormData
): Record<string, any> => {
  return (
    STABLE_FIELDS_BY_FORM_TYPE[stepType]?.reduce((acc, field) => {
      return { ...acc, [field]: rawForm[field] }
    }, {}) ?? {}
  )
}
const getCurrentFormFields = (
  rawForm: FormData,
  fields: string[]
): Record<string, any> => {
  return fields.reduce((acc, field) => {
    return { ...acc, [field]: rawForm[field] }
  }, {})
}

type SubmergeRetractAspirateDispensePrefix =
  | 'aspirate_submerge'
  | 'aspirate_retract'
  | 'dispense_submerge'
  | 'dispense_retract'

const getOffsetFields = (
  offset: Vector3D,
  prefix: string
): Record<string, number> => {
  return {
    [`${prefix}_x_position`]: offset.x,
    [`${prefix}_y_position`]: offset.y,
    [`${prefix}_mmFromBottom`]: offset.z,
  }
}

const getDelayFields = (
  delay: DelayProperties,
  prefix: string,
  checkbox: boolean = true
): Record<string, any> => {
  const { enable, params } = delay
  return {
    ...(checkbox ? { [`${prefix}_delay_checkbox`]: enable } : {}),
    [`${prefix}_delay_seconds`]: params?.duration ?? 0,
  }
}

const getPositionReferenceFields = (
  positionReference: PositionReference,
  prefix: string
): Record<string, PositionReference> => {
  return {
    [`${prefix}_position_reference`]: positionReference,
  }
}

const getFlowRateFields = (
  volume: number,
  flowRateByVolume: LiquidHandlingPropertyByVolume,
  liquidHandlingAction: LiquidHandlingTab,
  hardwareMaximum: number | null = null
): Record<string, number | null> => {
  const interpolatedFlowRate = linearInterpolate(
    volume,
    flowRateByVolume as Array<[number, number]>
  )
  return {
    [`${liquidHandlingAction}_flowRate`]:
      hardwareMaximum != null
        ? (min([interpolatedFlowRate, hardwareMaximum]) ?? null)
        : interpolatedFlowRate,
  }
}

const getSpeedFields = (
  speed: number,
  prefix: SubmergeRetractAspirateDispensePrefix
): Record<string, number> => {
  return { [`${prefix}_speed`]: speed }
}

const getTouchTipFields = (
  touchTip: TouchTipProperties,
  liquidHandlingAction: LiquidHandlingTab
): Record<string, any> => {
  const { enable, params } = touchTip
  return {
    [`${liquidHandlingAction}_touchTip_checkbox`]: enable,
    [`${liquidHandlingAction}_touchTip_mmFromTop`]: params?.zOffset ?? null,
    [`${liquidHandlingAction}_touchTip_mmFromEdge`]: params?.mmFromEdge ?? null,
    [`${liquidHandlingAction}_touchTip_speed`]: params?.speed ?? null,
  }
}

const getBlowoutFields = (args: {
  blowout: BlowoutProperties
  additionalEquipmentEntities?: AdditionalEquipmentEntities
  disable?: boolean
  hardwareMaximumFlowRate?: number | null
}): Record<string, any> => {
  const {
    blowout,
    additionalEquipmentEntities = {},
    disable = false,
    hardwareMaximumFlowRate = null,
  } = args
  const { enable, params } = blowout

  // transform location
  let transformedLocation: string | null = null
  if (params?.location === 'trash') {
    transformedLocation =
      Object.values(additionalEquipmentEntities).find(
        ({ name }) => name === 'trashBin' || name === 'wasteChute'
      )?.id ?? null
  } else if (params?.location === 'source') {
    transformedLocation = SOURCE_WELL_BLOWOUT_DESTINATION
  } else if (params?.location === 'destination') {
    transformedLocation = DEST_WELL_BLOWOUT_DESTINATION
  }

  const checkedFlowRate =
    params != null
      ? min([
          params.flowRate,
          ...(hardwareMaximumFlowRate != null ? [hardwareMaximumFlowRate] : []),
        ])
      : null
  return {
    blowout_checkbox: enable && !(disable ?? false),
    blowout_flowRate: checkedFlowRate ?? null,
    blowout_location: transformedLocation,
  }
}

const getMixFields = (
  mix: MixProperties | null,
  prefix: string
): Record<string, any> => {
  if (mix == null) {
    return {}
  }
  const { enable, params } = mix
  return {
    [`${prefix}_mix_checkbox`]: enable,
    [`${prefix}_mix_times`]: params?.repetitions ?? null,
    [`${prefix}_mix_volume`]: params?.volume ?? null,
  }
}

const getByVolumeField = (args: {
  volume: number
  byVolume: LiquidHandlingPropertyByVolume
  field: string
  prefix?: string
}): Record<string, any> => {
  const { volume, byVolume, field, prefix } = args
  const interpolatedValue = linearInterpolate(
    volume,
    byVolume as Array<[number, number]>
  )
  const prefixWithField = `${prefix != null ? `${prefix}_` : ''}${field}`
  return {
    [`${prefixWithField}_checkbox`]: interpolatedValue !== 0,
    [`${prefixWithField}_volume`]:
      interpolatedValue !== 0 ? interpolatedValue : null,
  }
}

const getSubmergeRetractFields = (args: {
  submergeRetractLookup: Submerge | RetractAspirate | RetractDispense
  volumes: ReferenceVolumes
  liquidHandlingAction: LiquidHandlingTab
  tipMovement: 'submerge' | 'retract'
  additionalEquipmentEntities?: AdditionalEquipmentEntities
  isDisposalVolumeEnabled?: boolean
  isConditioningVolumeEnabled?: boolean
  blowoutMaxUiFlowRate?: number | null
}): Record<string, any> => {
  const {
    submergeRetractLookup,
    volumes,
    liquidHandlingAction,
    tipMovement,
    additionalEquipmentEntities,
    isDisposalVolumeEnabled = false,
    isConditioningVolumeEnabled = false,
    blowoutMaxUiFlowRate = null,
  } = args

  // all common submerge and retract fields
  const { delay, speed } = submergeRetractLookup
  const { positionReference, offset } =
    'startPosition' in submergeRetractLookup
      ? submergeRetractLookup.startPosition
      : submergeRetractLookup.endPosition
  const fullPrefix =
    `${liquidHandlingAction}_${tipMovement}` as SubmergeRetractAspirateDispensePrefix
  const offsetFields = getOffsetFields(offset, fullPrefix)
  const positionReferenceFields = getPositionReferenceFields(
    positionReference,
    fullPrefix
  )
  const delayFields = getDelayFields(delay, fullPrefix, false)
  const speedFields = getSpeedFields(speed, fullPrefix)

  // retract fields
  const airGapFields =
    'airGapByVolume' in submergeRetractLookup &&
    !(liquidHandlingAction === 'aspirate' && isConditioningVolumeEnabled)
      ? getByVolumeField({
          volume: volumes.airGap[liquidHandlingAction],
          byVolume: submergeRetractLookup.airGapByVolume,
          field: 'airGap',
          prefix: liquidHandlingAction,
        })
      : {}
  const touchTipFields =
    'touchTip' in submergeRetractLookup
      ? getTouchTipFields(submergeRetractLookup.touchTip, liquidHandlingAction)
      : {}

  // retract dispense fields
  const blowoutFields =
    'blowout' in submergeRetractLookup
      ? getBlowoutFields({
          blowout: submergeRetractLookup.blowout,
          additionalEquipmentEntities,
          disable: isDisposalVolumeEnabled,
          ...(blowoutMaxUiFlowRate != null
            ? { hardwareMaximumFlowRate: blowoutMaxUiFlowRate }
            : {}),
        })
      : {}

  return {
    ...offsetFields,
    ...positionReferenceFields,
    ...delayFields,
    ...speedFields,
    ...airGapFields,
    ...touchTipFields,
    ...blowoutFields,
  }
}

const getNoLiquidClassValuesMoveLiquid = (args: {
  rawForm: FormData
  convertedPipetteName: string
  liquidHandlingAction: LiquidClassSettingsType
  robotType: RobotType
  pipetteEntity: PipetteEntity
  tiprackDef: LabwareDefinition2
}): Record<string, any> => {
  const {
    rawForm,
    convertedPipetteName,
    liquidHandlingAction,
    robotType,
    pipetteEntity,
    tiprackDef,
  } = args
  const { tipRack: tiprack, path, volume: rawVolume, stepType } = rawForm
  if (stepType !== 'moveLiquid') {
    console.warn(`invalid step type for liquid classes: ${stepType}`)
    return {}
  }
  const volume = Number(rawVolume)
  const referenceLiquidClass = getAllLiquidClassDefs()[WATER_LIQUID_CLASS_NAME]
  const liquidClassValuesForPipette = referenceLiquidClass.byPipette.find(
    ({ pipetteModel }) => convertedPipetteName === pipetteModel
  )
  const liquidClassValuesForTip = liquidClassValuesForPipette?.byTipType.find(
    tipObject => tipObject.tiprack === tiprack
  )
  const { spec: pipetteSpecs } = pipetteEntity
  if (robotType === OT2_ROBOT_TYPE) {
    const zSpeedOT2 =
      CHANNELS_MAPPED_TO_MAX_SPEED[OT2_ROBOT_TYPE][pipetteSpecs.channels].z
    const dipsosalFields =
      rawForm.path === 'multiDispense'
        ? {
            disposalVolume_checkbox: true,
            disposalVolume_volume: pipetteSpecs.liquids.default.minVolume,
            blowout_location: SOURCE_WELL_BLOWOUT_DESTINATION,
          }
        : {}
    const allOT2Defaults = getDefaultsForStepType('moveLiquid')
    const matchingTipLiquidSpecs =
      pipetteEntity != null
        ? getMatchingTipLiquidSpecs(pipetteEntity.spec, volume, tiprackDef)
        : null
    const aspirateOT2Defaults = {
      aspirate_wellOrder_first: allOT2Defaults.aspirate_wellOrder_first,
      aspirate_wellOrder_second: allOT2Defaults.aspirate_wellOrder_second,
      preWetTip: allOT2Defaults.preWetTip,
      aspirate_airGap_checkbox: allOT2Defaults.aspirate_airGap_checkbox,
      aspirate_airGap_volume: allOT2Defaults.aspirate_airGap_volume,
      aspirate_mix_checkbox: allOT2Defaults.aspirate_mix_checkbox,
      aspirate_mix_times: allOT2Defaults.aspirate_mix_times,
      aspirate_delay_checkbox: allOT2Defaults.aspirate_delay_checkbox,
      aspirate_delay_seconds: allOT2Defaults.aspirate_delay_seconds,
      aspirate_flowRate:
        matchingTipLiquidSpecs?.defaultAspirateFlowRate.default ?? null,
      aspirate_mmFromBottom: allOT2Defaults.aspirate_mmFromBottom,
      aspirate_position_reference: allOT2Defaults.aspirate_position_reference,
      aspirate_touchTip_checkbox: allOT2Defaults.aspirate_touchTip_checkbox,
      aspirate_submerge_speed: zSpeedOT2,
      aspirate_submerge_mmFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
      aspirate_submerge_delay_seconds:
        allOT2Defaults.aspirate_submerge_delay_seconds,
      aspirate_retract_speed: zSpeedOT2,
      aspirate_retract_mmFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
      aspirate_retract_delay_seconds:
        allOT2Defaults.aspirate_retract_delay_seconds,
    }
    const pushOutVolume =
      tiprackDef != null
        ? getDefaultPushOutVolume(
            Number(rawForm.volume),
            pipetteSpecs,
            tiprackDef
          )
        : 0
    const dispenseOT2Defaults = {
      dispense_wellOrder_first: allOT2Defaults.dispense_wellOrder_first,
      dispense_wellOrder_second: allOT2Defaults.dispense_wellOrder_second,
      dispense_airGap_checkbox: allOT2Defaults.dispense_airGap_checkbox,
      dispense_airGap_volume: allOT2Defaults.dispense_airGap_volume,
      dispense_mix_checkbox: allOT2Defaults.dispense_mix_checkbox,
      dispense_mix_times: allOT2Defaults.dispense_mix_times,
      dispense_delay_checkbox: allOT2Defaults.dispense_delay_checkbox,
      dispense_delay_seconds: allOT2Defaults.dispense_delay_seconds,
      dispense_flowRate:
        matchingTipLiquidSpecs?.defaultDispenseFlowRate.default ?? null,
      dispense_mmFromBottom: allOT2Defaults.dispense_mmFromBottom,
      dispense_position_reference: allOT2Defaults.dispense_position_reference,
      dispense_touchTip_checkbox: allOT2Defaults.dispense_touchTip_checkbox,
      pushOut_checkbox: pushOutVolume > 0,
      pushOut_volume: pushOutVolume,
      dispense_submerge_speed: zSpeedOT2,
      dispense_submerge_mmFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
      dispense_submerge_delay_seconds:
        allOT2Defaults.dispense_submerge_delay_seconds,
      dispense_retract_speed: zSpeedOT2,
      dispense_retract_mmFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
      dispense_retract_delay_seconds:
        allOT2Defaults.dispense_retract_delay_seconds,
      blowout_flowRate:
        matchingTipLiquidSpecs?.defaultBlowOutFlowRate.default ?? null,
      ...dipsosalFields,
    }
    return {
      ...(liquidHandlingAction === 'all' || liquidHandlingAction === 'aspirate'
        ? aspirateOT2Defaults
        : {}),
      ...(liquidHandlingAction === 'all' || liquidHandlingAction === 'dispense'
        ? dispenseOT2Defaults
        : {}),
    }
  }
  if (liquidClassValuesForTip == null) {
    return {}
  }
  const { aspirate, singleDispense, multiDispense } = liquidClassValuesForTip
  const { multiWellHandling, referenceVolumes: byVolumeLookup } =
    getTransferPlanAndReferenceVolumes({
      pipetteSpecs,
      tiprackDefinition: null,
      conditioningByVolume: (multiDispense?.conditioningByVolume ??
        []) as Array<[number, number]>,
      disposalByVolume: (multiDispense?.disposalByVolume ?? []) as Array<
        [number, number]
      >,
      volume,
      path: rawForm.path as PathOption,
      numAspirateWells: rawForm.aspirate_wells.length,
      numDispenseWells: rawForm.dispense_wells.length,
      aspirateAirGapByVolume: aspirate.retract.airGapByVolume as Array<
        [number, number]
      >,
    })
  const { isSupported: isMultiDispenseSupported } = multiWellHandling
  const dispense =
    multiDispense != null &&
    path === 'multiDispense' &&
    isMultiDispenseSupported
      ? multiDispense
      : singleDispense

  const matchingTipLiquidSpecs =
    pipetteEntity != null
      ? getMatchingTipLiquidSpecs(pipetteEntity.spec, volume, tiprackDef)
      : null

  const aspirateCorrectionVolume =
    linearInterpolate(
      byVolumeLookup.correction.aspirate,
      liquidClassValuesForTip.aspirate.correctionByVolume as Array<
        [number, number]
      >
    ) ?? 0
  const dispenseCorrectionVolume =
    linearInterpolate(
      byVolumeLookup.correction.dispense,
      dispense.correctionByVolume as Array<[number, number]>
    ) ?? 0

  const aspirateMaxUiFlowRate =
    matchingTipLiquidSpecs != null
      ? getMaxUiFlowRate({
          targetVolume: byVolumeLookup.flowRate.aspirate,
          channels: pipetteSpecs.channels,
          robotType,
          flowRateType: 'aspirate',
          tipLiquidSpecs: matchingTipLiquidSpecs,
          shaftULperMM: pipetteSpecs.shaftULperMM,
          correctionVolume: aspirateCorrectionVolume,
        })
      : null
  const dispenseMaxUiFlowRate =
    matchingTipLiquidSpecs != null
      ? getMaxUiFlowRate({
          targetVolume: byVolumeLookup.flowRate.dispense,
          channels: pipetteSpecs.channels,
          robotType,
          flowRateType: 'dispense',
          tipLiquidSpecs: matchingTipLiquidSpecs,
          shaftULperMM: pipetteSpecs.shaftULperMM,
          correctionVolume: dispenseCorrectionVolume,
        })
      : null
  const blowoutMaxUiFlowRate =
    matchingTipLiquidSpecs != null
      ? getMaxUiFlowRate({
          channels: pipetteSpecs.channels,
          robotType,
          flowRateType: 'blowout',
          shaftULperMM: pipetteSpecs.shaftULperMM,
        })
      : null

  const aspirateFlowRateFields = getFlowRateFields(
    volume,
    aspirate.flowRateByVolume,
    'aspirate',
    aspirateMaxUiFlowRate
  )

  const dispenseFlowRateFields = getFlowRateFields(
    volume,
    dispense.flowRateByVolume,
    'dispense',
    dispenseMaxUiFlowRate
  )

  const blowoutFlowRateFields = {
    blowout_flowRate: dispense.retract.blowout.params?.flowRate ?? null,
  }

  const pushOutVolume =
    linearInterpolate(
      volume,
      singleDispense.pushOutByVolume as Array<[number, number]>
    ) ?? 0

  const aspirateOffsetFields = getOffsetFields(
    aspirate.aspiratePosition.offset,
    'aspirate'
  )
  const dispenseOffsetFields = getOffsetFields(
    dispense.dispensePosition.offset,
    'dispense'
  )
  const aspiratePositionReferenceFields = getPositionReferenceFields(
    aspirate.aspiratePosition.positionReference,
    'aspirate'
  )
  const dispensePositionReferenceFields = getPositionReferenceFields(
    dispense.dispensePosition.positionReference,
    'dispense'
  )

  const aspirateFields = {
    ...aspirateFlowRateFields,
    ...aspirateOffsetFields,
    ...aspiratePositionReferenceFields,
    aspirate_mmFromBottom: DEFAULT_MM_OFFSET_FROM_BOTTOM,
    aspirate_submerge_mmFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    aspirate_submerge_position_reference: POSITION_REFERENCE_TOP,
    aspirate_submerge_x_position: 0,
    aspirate_submerge_y_position: 0,
    aspirate_submerge_speed: aspirate.submerge.speed,
    aspirate_retract_speed: aspirate.retract.speed,
    aspirate_retract_mmFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    aspirate_retract_position_reference: POSITION_REFERENCE_TOP,
    aspirate_retract_x_position: 0,
    aspirate_retract_y_position: 0,
    aspirate_touchTip_speed: aspirate.retract.touchTip.params?.speed,
    aspirate_touchTip_mmFromEdge: aspirate.retract.touchTip.params?.mmFromEdge,
    aspirate_touchTip_mmFromTop: aspirate.retract.touchTip.params?.zOffset,
    aspirate_retract_delay_seconds: 0,
    aspirate_submerge_delay_seconds: 0,
  }
  const dispenseFields = {
    ...dispenseFlowRateFields,
    ...dispenseOffsetFields,
    ...dispensePositionReferenceFields,
    ...blowoutFlowRateFields,
    dispense_mmFromBottom: DEFAULT_MM_OFFSET_FROM_BOTTOM,
    dispense_submerge_mmFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    dispense_submerge_position_reference: POSITION_REFERENCE_TOP,
    dispense_submerge_x_position: 0,
    dispense_submerge_y_position: 0,
    dispense_submerge_speed: dispense.submerge.speed,
    dispense_retract_speed: dispense.retract.speed,
    dispense_retract_mmFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    dispense_retract_position_reference: POSITION_REFERENCE_TOP,
    dispense_retract_x_position: 0,
    dispense_retract_y_position: 0,
    pushOut_checkbox: pushOutVolume > 0,
    pushOut_volume: pushOutVolume,
    dispense_touchTip_speed: dispense.retract.touchTip.params?.speed,
    dispense_touchTip_mmFromEdge: dispense.retract.touchTip.params?.mmFromEdge,
    dispense_touchTip_mmFromTop: dispense.retract.touchTip.params?.zOffset,
    dispense_retract_delay_seconds: 0,
    dispense_submerge_delay_seconds: 0,
    blowout_flowRate:
      min([
        dispense.retract.blowout.params?.flowRate ??
          matchingTipLiquidSpecs?.defaultBlowOutFlowRate.default,
        blowoutMaxUiFlowRate,
      ]) ?? null,
  }
  return {
    ...getDefaultsForStepType(stepType),
    ...getStableFieldsAndValues('moveLiquid', rawForm),
    // update liquid class values for specified tab(s)
    ...(liquidHandlingAction === 'all' || liquidHandlingAction === 'aspirate'
      ? aspirateFields
      : {}),
    ...(liquidHandlingAction === 'all' || liquidHandlingAction === 'dispense'
      ? dispenseFields
      : {}),
    // keep current tab form data if only updating one tab
    ...(liquidHandlingAction === 'aspirate'
      ? getCurrentFormFields(rawForm, Object.keys(dispenseFields))
      : {}),
    ...(liquidHandlingAction === 'dispense'
      ? getCurrentFormFields(rawForm, Object.keys(aspirateFields))
      : {}),
  }
}

const getNoLiquidClassValuesMix = (args: {
  rawForm: FormData
  convertedPipetteName: string
  liquidHandlingAction: LiquidClassSettingsType
  pipetteEntity: PipetteEntity
  tiprackDef: LabwareDefinition2
  robotType: RobotType
}): Record<string, any> => {
  const {
    rawForm,
    convertedPipetteName,
    liquidHandlingAction,
    pipetteEntity,
    tiprackDef,
    robotType,
  } = args
  const { tipRack: tiprack, volume: rawVolume, stepType } = rawForm
  if (stepType !== 'mix') {
    console.warn(`invalid step type for liquid classes: ${stepType}`)
    return {}
  }
  const { spec: pipetteSpecs } = pipetteEntity
  const volume = Number(rawVolume)
  const referenceLiquidClass = getAllLiquidClassDefs()[WATER_LIQUID_CLASS_NAME]
  const liquidClassValuesForPipette = referenceLiquidClass.byPipette.find(
    ({ pipetteModel }) => convertedPipetteName === pipetteModel
  )
  const liquidClassValuesForTip = liquidClassValuesForPipette?.byTipType.find(
    tipObject => tipObject.tiprack === tiprack
  )

  const matchingTipLiquidSpecs =
    pipetteEntity != null
      ? getMatchingTipLiquidSpecs(pipetteEntity.spec, volume, tiprackDef)
      : null
  const aspirateCorrectionVolume =
    linearInterpolate(
      volume,
      (liquidClassValuesForTip?.aspirate.correctionByVolume as Array<
        [number, number]
      >) ?? []
    ) ?? 0
  const dispenseCorrectionVolume =
    linearInterpolate(
      volume,
      (liquidClassValuesForTip?.singleDispense.correctionByVolume as Array<
        [number, number]
      >) ?? []
    ) ?? 0

  const aspirateMaxUiFlowRate =
    matchingTipLiquidSpecs != null
      ? getMaxUiFlowRate({
          targetVolume: volume,
          channels: pipetteSpecs.channels,
          robotType,
          flowRateType: 'aspirate',
          tipLiquidSpecs: matchingTipLiquidSpecs,
          shaftULperMM: pipetteSpecs.shaftULperMM,
          correctionVolume: aspirateCorrectionVolume,
        })
      : null
  const dispenseMaxUiFlowRate =
    matchingTipLiquidSpecs != null
      ? getMaxUiFlowRate({
          targetVolume: volume,
          channels: pipetteSpecs.channels,
          robotType,
          flowRateType: 'dispense',
          tipLiquidSpecs: matchingTipLiquidSpecs,
          shaftULperMM: pipetteSpecs.shaftULperMM,
          correctionVolume: dispenseCorrectionVolume,
        })
      : null

  if (robotType === OT2_ROBOT_TYPE || liquidClassValuesForTip == null) {
    return {
      aspirate_flowRate:
        matchingTipLiquidSpecs?.defaultAspirateFlowRate.default ?? null,
      dispense_flowRate:
        matchingTipLiquidSpecs?.defaultDispenseFlowRate.default ?? null,
    }
  }
  const { aspirate, singleDispense } = liquidClassValuesForTip

  const aspirateFlowRateFields = getFlowRateFields(
    volume,
    aspirate.flowRateByVolume,
    'aspirate',
    aspirateMaxUiFlowRate
  )
  const aspiratePositionReferenceFields = getPositionReferenceFields(
    aspirate.aspiratePosition.positionReference,
    'mix'
  )
  const dispenseFlowRateFields = getFlowRateFields(
    volume,
    singleDispense.flowRateByVolume,
    'dispense',
    dispenseMaxUiFlowRate
  )

  const blowoutMaxUiFlowRate =
    matchingTipLiquidSpecs != null
      ? getMaxUiFlowRate({
          channels: pipetteSpecs.channels,
          robotType,
          flowRateType: 'blowout',
          shaftULperMM: pipetteSpecs.shaftULperMM,
        })
      : null

  const pushOutVolume =
    linearInterpolate(
      volume,
      singleDispense.pushOutByVolume as Array<[number, number]>
    ) ?? 0

  const aspirateFields = {
    ...aspirateFlowRateFields,
    ...aspiratePositionReferenceFields,
  }
  const dispenseFields = {
    ...dispenseFlowRateFields,
    pushOut_checkbox: pushOutVolume > 0,
    pushOut_volume: pushOutVolume,
    mix_touchTip_speed: singleDispense.retract.touchTip.params?.speed,
    mix_touchTip_mmFromEdge: singleDispense.retract.touchTip.params?.mmFromEdge,
    mix_touchTip_mmFromTop: singleDispense.retract.touchTip.params?.zOffset,
    blowout_flowRate: min([
      singleDispense.retract.blowout.params?.flowRate,
      blowoutMaxUiFlowRate,
    ]),
  }

  return {
    ...getDefaultsForStepType(stepType),
    ...getStableFieldsAndValues('mix', rawForm),
    // update liquid class values for specified tab(s)
    ...(liquidHandlingAction === 'all' || liquidHandlingAction === 'aspirate'
      ? aspirateFields
      : {}),
    ...(liquidHandlingAction === 'all' || liquidHandlingAction === 'dispense'
      ? dispenseFields
      : {}),
    // keep current tab form data if only updating one tab
    ...(liquidHandlingAction === 'aspirate'
      ? getCurrentFormFields(rawForm, Object.keys(dispenseFields))
      : {}),
    ...(liquidHandlingAction === 'dispense'
      ? getCurrentFormFields(rawForm, Object.keys(aspirateFields))
      : {}),
  }
}

const getLiquidClassValuesMoveLiquid = (args: {
  rawForm: FormData
  liquidClassValuesForTip: ByTipTypeSetting
  additionalEquipmentEntities: AdditionalEquipmentEntities
  liquidHandlingAction: LiquidClassSettingsType
  pipetteEntity: PipetteEntity
  tiprackDef: LabwareDefinition2
  robotType: RobotType
}): Record<string, any> => {
  const {
    rawForm,
    liquidClassValuesForTip,
    additionalEquipmentEntities,
    liquidHandlingAction,
    pipetteEntity,
    tiprackDef,
    robotType,
  } = args
  const { aspirate, singleDispense, multiDispense } = liquidClassValuesForTip
  const { path, volume: rawVolume } = rawForm
  const { spec: pipetteSpecs } = pipetteEntity
  const volume = Number(rawVolume)
  const {
    flowRateByVolume: aspirateFlowRateByVolume,
    aspiratePosition,
    preWet,
    mix: aspirateMix,
    delay: aspirateDelay,
  } = aspirate
  const {
    positionReference: aspiratePositionReference,
    offset: aspirateOffset,
  } = aspiratePosition

  const dispense =
    multiDispense != null && path === 'multiDispense'
      ? multiDispense
      : singleDispense
  const {
    flowRateByVolume: dispenseFlowRateByVolume,
    dispensePosition,
    delay: dispenseDelay,
  } = dispense
  const {
    positionReference: dispensePositionReference,
    offset: dispenseOffset,
  } = dispensePosition
  const { pushOutByVolume } = singleDispense // always get pushOut from singleDispense
  const dispenseMix = 'mix' in dispense ? dispense.mix : null
  const {
    conditioningByVolume: rawConditioningByVolume = [],
    disposalByVolume: rawDisposalByVolume = [],
  } = multiDispense ?? {}
  const conditioningByVolume = rawConditioningByVolume as Array<
    [number, number]
  >
  const disposalByVolume = rawDisposalByVolume as Array<[number, number]>
  const { referenceVolumes: byVolumeLookup, multiWellHandling } =
    getTransferPlanAndReferenceVolumes({
      pipetteSpecs,
      tiprackDefinition: tiprackDef,
      conditioningByVolume,
      disposalByVolume,
      volume,
      path: rawForm.path as PathOption,
      numAspirateWells: rawForm.aspirate_wells.length,
      numDispenseWells: rawForm.dispense_wells.length,
      aspirateAirGapByVolume: aspirate.retract.airGapByVolume as Array<
        [number, number]
      >,
    })
  const { isSupported: isMultiDispenseSupported } = multiWellHandling
  // top-level aspirate fields
  const aspiratePositionReferenceFields = getPositionReferenceFields(
    aspiratePositionReference,
    'aspirate'
  )
  const aspirateOffsetFields = getOffsetFields(aspirateOffset, 'aspirate')
  const matchingTipLiquidSpecs =
    pipetteEntity != null
      ? getMatchingTipLiquidSpecs(pipetteEntity.spec, volume, tiprackDef)
      : null

  const aspirateCorrectionVolume =
    linearInterpolate(
      byVolumeLookup.correction.aspirate,
      liquidClassValuesForTip.aspirate.correctionByVolume as Array<
        [number, number]
      >
    ) ?? 0
  const dispenseCorrectionVolume =
    linearInterpolate(
      byVolumeLookup.correction.dispense,
      dispense.correctionByVolume as Array<[number, number]>
    ) ?? 0

  const aspirateMaxUiFlowRate =
    matchingTipLiquidSpecs != null
      ? getMaxUiFlowRate({
          targetVolume: byVolumeLookup.flowRate.aspirate,
          channels: pipetteSpecs.channels,
          robotType,
          flowRateType: 'aspirate',
          tipLiquidSpecs: matchingTipLiquidSpecs,
          shaftULperMM: pipetteSpecs.shaftULperMM,
          correctionVolume: aspirateCorrectionVolume,
        })
      : null
  const dispenseMaxUiFlowRate =
    matchingTipLiquidSpecs != null
      ? getMaxUiFlowRate({
          targetVolume: byVolumeLookup.flowRate.dispense,
          channels: pipetteSpecs.channels,
          robotType,
          flowRateType: 'dispense',
          tipLiquidSpecs: matchingTipLiquidSpecs,
          shaftULperMM: pipetteSpecs.shaftULperMM,
          correctionVolume: dispenseCorrectionVolume,
        })
      : null

  const blowoutMaxUiFlowRate =
    matchingTipLiquidSpecs != null
      ? getMaxUiFlowRate({
          channels: pipetteSpecs.channels,
          robotType,
          flowRateType: 'blowout',
          shaftULperMM: pipetteSpecs.shaftULperMM,
        })
      : null

  const aspirateFlowRateFields = getFlowRateFields(
    byVolumeLookup.flowRate.aspirate,
    aspirateFlowRateByVolume,
    'aspirate',
    aspirateMaxUiFlowRate
  )
  const preWetFields = { preWetTip: preWet }
  const aspirateMixFields = getMixFields(aspirateMix, 'aspirate')
  const aspirateDelayFields = getDelayFields(aspirateDelay, 'aspirate')

  // top-level dispense fields
  const dispensePositionFields = getPositionReferenceFields(
    dispensePositionReference,
    'dispense'
  )
  const dispenseOffsetFields = getOffsetFields(dispenseOffset, 'dispense')
  const dispenseFlowRateFields = getFlowRateFields(
    byVolumeLookup.flowRate.dispense,
    dispenseFlowRateByVolume,
    'dispense',
    dispenseMaxUiFlowRate
  )
  const dispenseMixFields = getMixFields(dispenseMix, 'dispense')
  const dispenseDelayFields = getDelayFields(dispenseDelay, 'dispense')
  const pushOutFields =
    pushOutByVolume != null
      ? getByVolumeField({
          volume: byVolumeLookup.pushOut,
          byVolume: pushOutByVolume,
          field: 'pushOut',
        })
      : {}
  const conditioningFields =
    multiDispense != null && byVolumeLookup.conditioning != null
      ? getByVolumeField({
          volume: byVolumeLookup.conditioning,
          byVolume: conditioningByVolume,
          field: 'conditioning',
        })
      : {}
  const disposalFields =
    multiDispense != null && byVolumeLookup.disposal != null
      ? getByVolumeField({
          volume: byVolumeLookup.disposal,
          byVolume: disposalByVolume,
          field: 'disposalVolume',
        })
      : {}

  const isConditioningVolumeEnabled =
    conditioningFields.conditioning_volume > 0 && path === 'multiDispense'
  const isDisposalVolumeEnabled =
    disposalFields.disposalVolume_volume > 0 && path === 'multiDispense'

  // aspirate/dispense submerge fields
  const aspirateSubmergeFields = getSubmergeRetractFields({
    submergeRetractLookup: aspirate.submerge,
    volumes: byVolumeLookup,
    liquidHandlingAction: 'aspirate',
    tipMovement: 'submerge',
    additionalEquipmentEntities,
  })
  const dispenseSubmergeFields = getSubmergeRetractFields({
    submergeRetractLookup:
      path === 'multiDispense' &&
      multiDispense != null &&
      isMultiDispenseSupported
        ? multiDispense.submerge
        : singleDispense.submerge,
    volumes: byVolumeLookup,
    liquidHandlingAction: 'dispense',
    tipMovement: 'submerge',
  })

  // aspirate/dispense retract fields
  const aspirateRetractFields = getSubmergeRetractFields({
    submergeRetractLookup: aspirate.retract,
    volumes: byVolumeLookup,
    liquidHandlingAction: 'aspirate',
    tipMovement: 'retract',
    isConditioningVolumeEnabled,
  })
  const dispenseRetractFields = getSubmergeRetractFields({
    submergeRetractLookup:
      path === 'multiDispense' &&
      multiDispense != null &&
      isMultiDispenseSupported
        ? multiDispense.retract
        : singleDispense.retract,
    volumes: byVolumeLookup,
    liquidHandlingAction: 'dispense',
    tipMovement: 'retract',
    additionalEquipmentEntities,
    isDisposalVolumeEnabled,
    blowoutMaxUiFlowRate,
  })

  const aspirateFields = {
    ...aspiratePositionReferenceFields,
    ...aspirateOffsetFields,
    ...preWetFields,
    ...aspirateMixFields,
    ...aspirateDelayFields,
    ...aspirateSubmergeFields,
    ...aspirateRetractFields,
    ...aspirateFlowRateFields,
  }
  const dispenseFields = {
    ...dispensePositionFields,
    ...dispenseOffsetFields,
    ...dispenseFlowRateFields,
    ...dispenseMixFields,
    ...dispenseDelayFields,
    ...conditioningFields,
    ...disposalFields,
    ...pushOutFields,
    ...dispenseSubmergeFields,
    ...dispenseRetractFields,
  }

  return {
    ...getDefaultsForStepType(rawForm.stepType),
    ...getStableFieldsAndValues('moveLiquid', rawForm), // replace fields unaffected by liquid class-related changes
    // update liquid class values for specified tab(s)
    ...(liquidHandlingAction === 'all' || liquidHandlingAction === 'aspirate'
      ? aspirateFields
      : {}),
    ...(liquidHandlingAction === 'all' || liquidHandlingAction === 'dispense'
      ? dispenseFields
      : {}),
    // keep current tab form data if only updating one tab
    ...(liquidHandlingAction === 'aspirate'
      ? getCurrentFormFields(rawForm, Object.keys(dispenseFields))
      : {}),
    ...(liquidHandlingAction === 'dispense'
      ? getCurrentFormFields(rawForm, Object.keys(aspirateFields))
      : {}),
  }
}

const getLiquidClassValuesMix = (args: {
  rawForm: FormData
  liquidClassValuesForTip: ByTipTypeSetting
  additionalEquipmentEntities: AdditionalEquipmentEntities
  liquidHandlingAction: LiquidClassSettingsType
  pipetteEntity: PipetteEntity
  tiprackDef: LabwareDefinition2
  robotType: RobotType
}): Record<string, any> => {
  const {
    rawForm,
    liquidClassValuesForTip,
    additionalEquipmentEntities,
    liquidHandlingAction,
    pipetteEntity,
    tiprackDef,
    robotType,
  } = args
  const { volume: rawVolume } = rawForm
  const volume = Number(rawVolume)
  const { aspirate, singleDispense } = liquidClassValuesForTip
  const { spec: pipetteSpecs } = pipetteEntity
  const {
    flowRateByVolume: aspirateFlowRateByVolume,
    aspiratePosition,
    delay: aspirateDelay,
  } = aspirate
  const { positionReference, offset } = aspiratePosition
  const {
    flowRateByVolume: dispenseFlowRateByVolume,
    delay: dispenseDelay,
    retract: dispenseRetract,
    pushOutByVolume,
  } = singleDispense

  const matchingTipLiquidSpecs =
    pipetteEntity != null
      ? getMatchingTipLiquidSpecs(pipetteEntity.spec, volume, tiprackDef)
      : null

  const aspirateCorrectionVolume =
    linearInterpolate(
      volume,
      liquidClassValuesForTip.aspirate.correctionByVolume as Array<
        [number, number]
      >
    ) ?? 0
  const dispenseCorrectionVolume =
    linearInterpolate(
      volume,
      liquidClassValuesForTip.singleDispense.correctionByVolume as Array<
        [number, number]
      >
    ) ?? 0

  const aspirateMaxUiFlowRate =
    matchingTipLiquidSpecs != null
      ? getMaxUiFlowRate({
          targetVolume: volume,
          channels: pipetteSpecs.channels,
          robotType,
          flowRateType: 'aspirate',
          tipLiquidSpecs: matchingTipLiquidSpecs,
          shaftULperMM: pipetteSpecs.shaftULperMM,
          correctionVolume: aspirateCorrectionVolume,
        })
      : null
  const dispenseMaxUiFlowRate =
    matchingTipLiquidSpecs != null
      ? getMaxUiFlowRate({
          targetVolume: volume,
          channels: pipetteSpecs.channels,
          robotType,
          flowRateType: 'dispense',
          tipLiquidSpecs: matchingTipLiquidSpecs,
          shaftULperMM: pipetteSpecs.shaftULperMM,
          correctionVolume: dispenseCorrectionVolume,
        })
      : null

  const blowoutMaxUiFlowRate =
    matchingTipLiquidSpecs != null
      ? getMaxUiFlowRate({
          channels: pipetteSpecs.channels,
          robotType,
          flowRateType: 'blowout',
          shaftULperMM: pipetteSpecs.shaftULperMM,
        })
      : null
  const aspirateFlowRateFields = getFlowRateFields(
    volume,
    aspirateFlowRateByVolume,
    'aspirate',
    aspirateMaxUiFlowRate
  )
  const mixPositionReferenceFields = getPositionReferenceFields(
    positionReference,
    'mix'
  )
  const mixOffsetFields = getOffsetFields(offset, 'mix')

  const dispenseFlowRateFields = getFlowRateFields(
    volume,
    dispenseFlowRateByVolume,
    'dispense',
    dispenseMaxUiFlowRate
  )
  const aspirateDelayFields = getDelayFields(aspirateDelay, 'aspirate')
  const dispenseDelayFields = getDelayFields(dispenseDelay, 'dispense')
  const blowoutFields = getBlowoutFields({
    blowout: dispenseRetract.blowout,
    additionalEquipmentEntities,
    hardwareMaximumFlowRate: blowoutMaxUiFlowRate,
  })
  const pushOutFields = getByVolumeField({
    volume,
    byVolume: pushOutByVolume,
    field: 'pushOut',
  })
  const touchTipFields = getTouchTipFields(
    singleDispense.retract.touchTip,
    'dispense'
  )
  const aspirateFields = {
    ...aspirateFlowRateFields,
    ...mixPositionReferenceFields,
    ...mixOffsetFields,
    ...aspirateDelayFields,
  }
  const dispenseFields = {
    ...dispenseFlowRateFields,
    ...dispenseDelayFields,
    ...blowoutFields,
    ...pushOutFields,
    ...touchTipFields,
  }
  const values = {
    ...getDefaultsForStepType('mix'),
    ...getStableFieldsAndValues('mix', rawForm), // replace fields unaffected by liquid class-related changes
    // update liquid class values for specified tab(s)
    ...(liquidHandlingAction === 'all' || liquidHandlingAction === 'aspirate'
      ? aspirateFields
      : {}),
    ...(liquidHandlingAction === 'all' || liquidHandlingAction === 'dispense'
      ? dispenseFields
      : {}),
    // keep current tab form data if only updating one tab
    ...(liquidHandlingAction === 'aspirate'
      ? getCurrentFormFields(rawForm, Object.keys(dispenseFields))
      : {}),
    ...(liquidHandlingAction === 'dispense'
      ? getCurrentFormFields(rawForm, Object.keys(aspirateFields))
      : {}),
  }
  return values
}

export const getLiquidClassesValues = (args: {
  rawForm: FormData
  pipetteEntities: PipetteEntities
  additionalEquipmentEntities: AdditionalEquipmentEntities
  allLabwareDefs: LabwareDefByDefURI
  liquidHandlingAction?: LiquidClassSettingsType
  robotType: RobotType
}): Record<string, any> => {
  const {
    rawForm,
    pipetteEntities,
    additionalEquipmentEntities,
    allLabwareDefs,
    liquidHandlingAction = 'all',
    robotType,
  } = args
  const { liquidClass, pipette, tipRack, stepType } = rawForm
  if (stepType !== 'mix' && stepType !== 'moveLiquid') {
    console.warn(`invalid step type for liquid classes: ${stepType}`)
    return {}
  }

  const pipetteEntity = pipetteEntities[pipette]
  const tiprackDef = allLabwareDefs[tipRack]
  const liquidClasses = getAllLiquidClassDefs()
  const liquidClassDef = liquidClasses[liquidClass]
  if (pipetteEntity == null) {
    return {}
  }
  const convertedPipetteName = getFlexNameConversion(pipetteEntity.spec)
  if (liquidClass === NONE_LIQUID_CLASS_NAME || robotType === OT2_ROBOT_TYPE) {
    // OT-2 liquid class selection should always be "none"
    return stepType === 'moveLiquid'
      ? getNoLiquidClassValuesMoveLiquid({
          rawForm,
          convertedPipetteName,
          liquidHandlingAction,
          robotType,
          pipetteEntity,
          tiprackDef,
        })
      : getNoLiquidClassValuesMix({
          rawForm,
          convertedPipetteName,
          liquidHandlingAction,
          pipetteEntity,
          tiprackDef,
          robotType,
        })
  }
  if (liquidClassDef == null) {
    return {}
  }
  const liquidClassValuesForPipette = liquidClassDef.byPipette.find(
    ({ pipetteModel }) => convertedPipetteName === pipetteModel
  )
  const liquidClassValuesForTip = liquidClassValuesForPipette?.byTipType.find(
    ({ tiprack }) => tiprack === tipRack
  )
  if (liquidClassValuesForTip == null) {
    return {}
  }
  if (stepType === 'mix') {
    return getLiquidClassValuesMix({
      rawForm,
      liquidClassValuesForTip,
      additionalEquipmentEntities,
      liquidHandlingAction,
      pipetteEntity,
      tiprackDef,
      robotType,
    })
  }
  return getLiquidClassValuesMoveLiquid({
    rawForm,
    liquidClassValuesForTip,
    additionalEquipmentEntities,
    liquidHandlingAction,
    pipetteEntity,
    tiprackDef,
    robotType,
  })
}

export const updateFieldsForLiquidClass = (args: {
  propsForFields: FieldPropsByName
  rawForm: FormData
  pipetteEntities: PipetteEntities
  additionalEquipmentEntities: AdditionalEquipmentEntities
  allLabwareDefs: LabwareDefByDefURI
  liquidHandlingAction?: LiquidClassSettingsType
  robotType: RobotType
}): void => {
  const {
    propsForFields,
    rawForm,
    pipetteEntities,
    additionalEquipmentEntities,
    allLabwareDefs,
    liquidHandlingAction = 'all',
    robotType,
  } = args
  const fieldUpdates = getLiquidClassesValues({
    rawForm,
    pipetteEntities,
    additionalEquipmentEntities,
    allLabwareDefs,
    liquidHandlingAction,
    robotType,
  })

  Object.entries(fieldUpdates).forEach(([field, value]) => {
    if (field in propsForFields) {
      propsForFields[field].updateValue(value)
    }
  })
}
