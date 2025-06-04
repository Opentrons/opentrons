import round from 'lodash/round'
import uniq from 'lodash/uniq'

import {
  getAllLiquidClassDefs,
  getFlexNameConversion,
  linearInterpolate,
  POSITION_REFERENCE_TOP,
  SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
  WATER_LIQUID_CLASS_NAME,
} from '@opentrons/shared-data'
import { getTransferPlanAndReferenceVolumes } from '@opentrons/step-generation'

import { getPipetteCapacity } from '../../../pipettes/pipetteData'
import { canPipetteUseLabware, getWellSetForMultichannel } from '../../../utils'
import { getDefaultsForStepType } from '../getDefaultsForStepType'

import type {
  BlowoutProperties,
  ByTipTypeSetting,
  DelayProperties,
  LabwareDefinition2,
  LiquidHandlingPropertyByVolume,
  MixProperties,
  PipetteChannels,
  PipetteV2Specs,
  PositionReference,
  RetractAspirate,
  RetractDispense,
  Submerge,
  TouchTipProperties,
  Vector3D,
} from '@opentrons/shared-data'
import type {
  AdditionalEquipmentEntities,
  LabwareEntities,
  PipetteEntities,
} from '@opentrons/step-generation'
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
export function getMaxDisposalVolumeForMultidispense(
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
  return round(pipetteCapacity - volume * 2 - airGapVolume, DISPOSAL_VOL_DIGITS)
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
}
export function getDefaultWells(args: GetDefaultWellsArgs): string[] {
  const { labwareId, pipetteId, labwareEntities, pipetteEntities } = args
  if (
    !labwareId ||
    !labwareEntities[labwareId] ||
    !pipetteId ||
    !pipetteEntities[pipetteId]
  )
    return []
  const labwareDef = labwareEntities[labwareId].def
  const pipetteCanUseLabware = canPipetteUseLabware(
    pipetteEntities[pipetteId].spec,
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
  liquidHandlingAction: LiquidHandlingTab
): Record<string, number | null> => {
  const interpolatedFlowRate = linearInterpolate(
    volume,
    flowRateByVolume as Array<[number, number]>
  )
  return {
    [`${liquidHandlingAction}_flowRate`]: interpolatedFlowRate,
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

const getBlowoutFields = (
  blowout: BlowoutProperties,
  additionalEquipmentEntities: AdditionalEquipmentEntities = {},
  disable?: boolean
): Record<string, any> => {
  const { enable, params } = blowout
  // transform location to additional equipment entity ID
  const transformedLocation =
    (params?.location === 'trash'
      ? Object.values(additionalEquipmentEntities).find(
          ({ name }) => name === 'trashBin' || name === 'wasteChute'
        )?.id
      : params?.location) ?? null
  return {
    blowout_checkbox: enable && !(disable ?? false),
    blowout_flowRate: params?.flowRate ?? null,
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
  volume: number
  liquidHandlingAction: LiquidHandlingTab
  tipMovement: 'submerge' | 'retract'
  additionalEquipmentEntities?: AdditionalEquipmentEntities
  isDisposalVolumeEnabled?: boolean
  isConditioningVolumeEnabled?: boolean
}): Record<string, any> => {
  const {
    submergeRetractLookup,
    volume,
    liquidHandlingAction,
    tipMovement,
    additionalEquipmentEntities,
    isDisposalVolumeEnabled = true,
    isConditioningVolumeEnabled = true,
  } = args

  // all common submerge and retract fields
  const { delay, speed } = submergeRetractLookup
  const { positionReference, offset } =
    'startPosition' in submergeRetractLookup
      ? submergeRetractLookup.startPosition
      : submergeRetractLookup.endPosition
  const fullPrefix = `${liquidHandlingAction}_${tipMovement}` as SubmergeRetractAspirateDispensePrefix
  const offsetFields = getOffsetFields(offset, fullPrefix)
  const PositionReferenceFields = getPositionReferenceFields(
    positionReference,
    fullPrefix
  )
  const delayFields = getDelayFields(delay, fullPrefix, false)
  const speedFields = getSpeedFields(speed, fullPrefix)

  // retract fields
  const airGapFields =
    'airGapByVolume' in submergeRetractLookup && !isConditioningVolumeEnabled
      ? getByVolumeField({
          volume,
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
      ? getBlowoutFields(
          submergeRetractLookup.blowout,
          additionalEquipmentEntities,
          isDisposalVolumeEnabled
        )
      : {}

  return {
    ...offsetFields,
    ...PositionReferenceFields,
    ...delayFields,
    ...speedFields,
    ...airGapFields,
    ...touchTipFields,
    ...blowoutFields,
  }
}

const getNoLiquidClassValuesMoveLiquid = (
  rawForm: FormData,
  convertedPipetteName: string,
  liquidHandlingAction: LiquidClassSettingsType
): Record<string, any> => {
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
  if (liquidClassValuesForTip == null) {
    return {}
  }
  const { aspirate, singleDispense, multiDispense } = liquidClassValuesForTip
  const dispense =
    multiDispense != null && path === 'multiDispense'
      ? multiDispense
      : singleDispense
  const aspirateFlowRateFields = getFlowRateFields(
    volume,
    aspirate.flowRateByVolume,
    'aspirate'
  )

  const dispenseFlowRateFields = getFlowRateFields(
    volume,
    dispense.flowRateByVolume,
    'dispense'
  )
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
  }
  const dispenseFields = {
    ...dispenseFlowRateFields,
    ...dispenseOffsetFields,
    ...dispensePositionReferenceFields,
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

const getNoLiquidClassValuesMix = (
  rawForm: FormData,
  convertedPipetteName: string,
  liquidHandlingAction: LiquidClassSettingsType
): Record<string, any> => {
  const { tipRack: tiprack, volume: rawVolume, stepType } = rawForm
  if (stepType !== 'mix') {
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
  if (liquidClassValuesForTip == null) {
    return {}
  }
  const { aspirate, singleDispense } = liquidClassValuesForTip
  const aspirateFlowRateFields = getFlowRateFields(
    volume,
    aspirate.flowRateByVolume,
    'aspirate'
  )
  const aspiratePositionReferenceFields = getPositionReferenceFields(
    aspirate.aspiratePosition.positionReference,
    'mix'
  )
  const dispenseFlowRateFields = getFlowRateFields(
    volume,
    singleDispense.flowRateByVolume,
    'dispense'
  )

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
  pipetteSpecs: PipetteV2Specs
  labwareEntities: LabwareEntities
  additionalEquipmentEntities: AdditionalEquipmentEntities
  liquidHandlingAction: LiquidClassSettingsType
}): Record<string, any> => {
  const {
    rawForm,
    liquidClassValuesForTip,
    pipetteSpecs,
    labwareEntities,
    additionalEquipmentEntities,
    liquidHandlingAction,
  } = args
  const { aspirate, singleDispense, multiDispense } = liquidClassValuesForTip
  const { path, tipRack, volume: rawVolume } = rawForm
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
  const tiprackDefinition =
    Object.values(labwareEntities).find(
      ({ labwareDefURI }) => labwareDefURI === tipRack
    )?.def ?? null
  const byVolumeLookup = getTransferPlanAndReferenceVolumes({
    pipetteSpecs,
    tiprackDefinition,
    conditioningByVolume,
    disposalByVolume,
    volume: Number(rawForm.volume),
    path: rawForm.path as PathOption,
    numDispenseWells: rawForm.dispense_wells.length,
    aspirateAirGap:
      rawForm.aspirate_airGap_checkbox === true
        ? Number(rawForm.aspirate_airGap_volume)
        : null,
  }).referenceVolumes
  // top-level aspirate fields
  const aspiratePositionReferenceFields = getPositionReferenceFields(
    aspiratePositionReference,
    'aspirate'
  )
  const aspirateOffsetFields = getOffsetFields(aspirateOffset, 'aspirate')
  const aspirateFlowRateFields = getFlowRateFields(
    byVolumeLookup.flowRateAspirate,
    aspirateFlowRateByVolume,
    'aspirate'
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
    byVolumeLookup.flowRateDispense,
    dispenseFlowRateByVolume,
    'dispense'
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

  const isConditioningVolumeEnabled = conditioningFields.conditioning_volume > 0
  const isDisposalVolumeEnabled = disposalFields.disposalVolume_volume > 0

  // aspirate/dispense submerge fields
  const aspirateSubmergeFields = getSubmergeRetractFields({
    submergeRetractLookup: aspirate.submerge,
    volume: Number(volume),
    liquidHandlingAction: 'aspirate',
    tipMovement: 'submerge',
    additionalEquipmentEntities,
  })
  const dispenseSubmergeFields = getSubmergeRetractFields({
    submergeRetractLookup:
      path === 'multiDispense' && multiDispense != null
        ? multiDispense.submerge
        : singleDispense.submerge,
    volume: Number(volume),
    liquidHandlingAction: 'dispense',
    tipMovement: 'submerge',
  })

  // aspirate/dispense retract fields
  const aspirateRetractFields = getSubmergeRetractFields({
    submergeRetractLookup: aspirate.retract,
    volume: Number(volume),
    liquidHandlingAction: 'aspirate',
    tipMovement: 'retract',
    isConditioningVolumeEnabled,
  })
  const dispenseRetractFields = getSubmergeRetractFields({
    submergeRetractLookup:
      path === 'multiDispense' && multiDispense != null
        ? multiDispense.retract
        : singleDispense.retract,
    volume: Number(volume),
    liquidHandlingAction: 'dispense',
    tipMovement: 'retract',
    additionalEquipmentEntities,
    isDisposalVolumeEnabled,
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
}): Record<string, any> => {
  const {
    rawForm,
    liquidClassValuesForTip,
    additionalEquipmentEntities,
    liquidHandlingAction,
  } = args
  const { volume: rawVolume } = rawForm
  const volume = Number(rawVolume)
  const { aspirate, singleDispense } = liquidClassValuesForTip
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
  const aspirateFlowRateFields = getFlowRateFields(
    volume,
    aspirateFlowRateByVolume,
    'aspirate'
  )
  const mixPositionReferenceFields = getPositionReferenceFields(
    positionReference,
    'mix'
  )
  const mixOffsetFields = getOffsetFields(offset, 'mix')
  const dispenseFlowRateFields = getFlowRateFields(
    volume,
    dispenseFlowRateByVolume,
    'dispense'
  )
  const aspirateDelayFields = getDelayFields(aspirateDelay, 'aspirate')
  const dispenseDelayFields = getDelayFields(dispenseDelay, 'dispense')
  const blowoutFields = getBlowoutFields(
    dispenseRetract.blowout,
    additionalEquipmentEntities
  )
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
  labwareEntities: LabwareEntities
  additionalEquipmentEntities: AdditionalEquipmentEntities
  liquidHandlingAction?: LiquidClassSettingsType
}): Record<string, any> => {
  const {
    rawForm,
    pipetteEntities,
    labwareEntities,
    additionalEquipmentEntities,
    liquidHandlingAction = 'all',
  } = args
  const { liquidClass, pipette, tipRack, stepType } = rawForm
  if (stepType !== 'mix' && stepType !== 'moveLiquid') {
    console.warn(`invalid step type for liquid classes: ${stepType}`)
    return {}
  }

  const pipetteEntity = pipetteEntities[pipette]
  const liquidClasses = getAllLiquidClassDefs()
  const liquidClassDef = liquidClasses[liquidClass]
  if (pipetteEntity == null) {
    return {}
  }
  const { spec: pipetteSpecs } = pipetteEntity
  const convertedPipetteName = getFlexNameConversion(pipetteEntity.spec)
  if (liquidClass === 'none') {
    return stepType === 'moveLiquid'
      ? getNoLiquidClassValuesMoveLiquid(
          rawForm,
          convertedPipetteName,
          liquidHandlingAction
        )
      : getNoLiquidClassValuesMix(
          rawForm,
          convertedPipetteName,
          liquidHandlingAction
        )
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
    })
  }
  return getLiquidClassValuesMoveLiquid({
    rawForm,
    liquidClassValuesForTip,
    pipetteSpecs,
    labwareEntities,
    additionalEquipmentEntities,
    liquidHandlingAction,
  })
}

export const updateFieldsForLiquidClass = (args: {
  propsForFields: FieldPropsByName
  rawForm: FormData
  pipetteEntities: PipetteEntities
  labwareEntities: LabwareEntities
  additionalEquipmentEntities: AdditionalEquipmentEntities
  liquidHandlingAction?: LiquidClassSettingsType
}): void => {
  const {
    propsForFields,
    rawForm,
    pipetteEntities,
    labwareEntities,
    additionalEquipmentEntities,
    liquidHandlingAction = 'all',
  } = args
  const fieldUpdates = getLiquidClassesValues({
    rawForm,
    pipetteEntities,
    labwareEntities,
    additionalEquipmentEntities,
    liquidHandlingAction,
  })
  Object.entries(fieldUpdates).forEach(([field, value]) => {
    if (field in propsForFields) {
      propsForFields[field].updateValue(value)
    }
  })
}
