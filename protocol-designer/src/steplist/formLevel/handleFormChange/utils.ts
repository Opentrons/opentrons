import round from 'lodash/round'
import uniq from 'lodash/uniq'
import {
  getAllLiquidClassDefs,
  linearInterpolate,
} from '@opentrons/shared-data'
import { getFlexNameConversion } from '@opentrons/step-generation'
import { getWellSetForMultichannel, canPipetteUseLabware } from '../../../utils'
import { getPipetteCapacity } from '../../../pipettes/pipetteData'
import type {
  BlowoutProperties,
  Coordinates,
  DelayProperties,
  LabwareDefinition2,
  LiquidHandlingPropertyByVolume,
  MixProperties,
  PipetteChannels,
  PositionReference,
  RetractAspirate,
  RetractDispense,
  Submerge,
  TouchTipProperties,
} from '@opentrons/shared-data'
import type {
  AdditionalEquipmentEntities,
  LabwareEntities,
  PipetteEntities,
} from '@opentrons/step-generation'
import type { FormPatch } from '../../actions/types'
import type { FormData, PathOption, StepFieldName } from '../../../form-types'
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

type SubmergeRetractAspirateDispensePrefix =
  | 'aspirate_submerge'
  | 'aspirate_retract'
  | 'dispense_submerge'
  | 'dispense_retract'

const getOffsetFields = (
  offset: Coordinates,
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
  liquidHandlingAction: 'aspirate' | 'dispense'
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
  liquidHandlingAction: 'aspirate' | 'dispense'
): Record<string, any> => {
  const { enable, params } = touchTip
  return {
    [`${liquidHandlingAction}_touchTip_checkbox`]: enable,
    [`${liquidHandlingAction}_touchTip_mmFromTop`]: params?.zOffset ?? null,
    [`${liquidHandlingAction}_touchTip_mmFromEdge`]: params?.mmToEdge ?? null,
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
  mix: MixProperties,
  prefix: string
): Record<string, any> => {
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
  liquidHandlingAction: 'aspirate' | 'dispense'
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
  const { delay, offset, speed, positionReference } = submergeRetractLookup
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

export const getDefaultLiquidClassesValues = (
  rawForm: FormData,
  pipetteEntities: PipetteEntities,
  additionalEquipmentEntities: AdditionalEquipmentEntities,
  liquidHandlingAction: 'aspirate' | 'dispense' | 'all' = 'all'
): Record<string, any> | null => {
  // TODO (nd 04/07/2025): add logic for "none" liquid class
  const { liquidClass, pipette, tipRack, volume, path } = rawForm
  const pipetteEntity = pipetteEntities[pipette]
  const liquidClasses = getAllLiquidClassDefs()
  const liquidClassDef = liquidClasses[liquidClass]
  if (liquidClassDef == null || pipetteEntity == null) {
    return {}
  }
  const convertedPipetteName = getFlexNameConversion(pipetteEntity.spec)
  const liquidClassValuesForPipette = liquidClassDef.byPipette.find(
    ({ pipetteModel }) => convertedPipetteName === pipetteModel
  )
  const liquidClassValuesForTip = liquidClassValuesForPipette?.byTipType.find(
    ({ tiprack }) => tiprack === tipRack
  )
  if (liquidClassValuesForTip == null) {
    return null
  }
  const { aspirate, singleDispense, multiDispense } = liquidClassValuesForTip

  const {
    positionReference: aspiratePositionReference,
    offset: aspirateOffset,
    flowRateByVolume: aspirateFlowRateByVolume,
    // correctionByVolume: aspirateCorrectionByVolume,
    preWet,
    mix: aspirateMix,
    delay: aspirateDelay,
  } = aspirate

  const dispenseObject =
    multiDispense != null && path === 'multiDispense'
      ? multiDispense
      : singleDispense
  const {
    positionReference: dispensePositionReference,
    offset: dispenseOffset,
    flowRateByVolume: dispenseFlowRateByVolume,
    delay: dispenseDelay,
  } = dispenseObject
  const { pushOutByVolume } = singleDispense // always get pushOut from singleDispense
  const dispenseMix = 'mix' in dispenseObject ? dispenseObject.mix : null
  const { conditioningByVolume = [], disposalByVolume = [] } =
    multiDispense ?? {}

  // top-level aspirate fields
  const aspiratePositionReferenceFields = getPositionReferenceFields(
    aspiratePositionReference,
    'aspirate'
  )
  const aspirateOffsetFields = getOffsetFields(aspirateOffset, 'aspirate')
  const aspirateFlowRateFields = getFlowRateFields(
    Number(volume),
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
    Number(volume),
    dispenseFlowRateByVolume,
    'dispense'
  )
  const dispenseMixFields =
    dispenseMix != null ? getMixFields(dispenseMix, 'dispense') : {}
  const dispenseDelayFields = getDelayFields(dispenseDelay, 'dispense')
  const pushOutFields =
    pushOutByVolume != null
      ? getByVolumeField({
          volume: Number(volume),
          byVolume: pushOutByVolume,
          field: 'pushOut',
        })
      : {}
  const conditioningFields =
    multiDispense != null
      ? getByVolumeField({
          volume: Number(volume),
          byVolume: conditioningByVolume,
          field: 'conditioning',
        })
      : {}
  const disposalFields =
    multiDispense != null
      ? getByVolumeField({
          volume: Number(volume),
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
    ...(liquidHandlingAction === 'all' || liquidHandlingAction === 'aspirate'
      ? aspirateFields
      : {}),
    ...(liquidHandlingAction === 'all' || liquidHandlingAction === 'dispense'
      ? dispenseFields
      : {}),
  }
}
