import {
  getIsSlotAVacuumDock,
  getTrashBinAddressableAreaName,
} from '@opentrons/step-generation'

import { getStagingAreaAddressableAreas } from '../../utils'
import {
  composeMaskers,
  defaultTo,
  maskToFloat,
  maskToInteger,
  maskToSignedDecimal,
  maskToTime,
  maskToTimeWithPlaceholders,
  numberOrNull,
  onlyPositiveNumbers,
  trimDecimals,
} from './processing'

import type {
  AddressableAreaName,
  CutoutId,
  LabwareLocation,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  LabwareEntities,
  PipetteEntity,
  StagingAreaEntities,
  TipRackWithDef,
  TrashBinEntities,
  WasteChuteEntities,
} from '@opentrons/step-generation'
import type {
  HydratedFormData,
  LabwareOrAdditionalEquipmentEntity,
  StepFieldName,
} from '../../form-types'
import type { LabwareDefByDefURI } from '../../labware-defs'
import type { AmalgamateUnion } from '../../utils/utilityTypes'
import type { ValueCaster, ValueMasker } from './processing'

export type { StepFieldName }

const getLabwareOrAdditionalEquipmentEntity = (
  state: InvariantContext,
  id: string
): LabwareOrAdditionalEquipmentEntity | null => {
  if (state.labwareEntities[id] != null) {
    const labwareDisallowsTouchTip =
      state.labwareEntities[id]?.def.parameters.quirks?.includes(
        'touchTipDisabled'
      ) ?? false
    return {
      ...state.labwareEntities[id],
      isTouchTipAllowed: !labwareDisallowsTouchTip,
    }
  } else if (state.wasteChuteEntities[id] != null) {
    return {
      ...state.wasteChuteEntities[id],
      isTouchTipAllowed: false,
      name: 'wasteChute',
    }
  } else if (state.trashBinEntities[id] != null) {
    return {
      ...state.trashBinEntities[id],
      isTouchTipAllowed: false,
      name: 'trashBin',
    }
  } else return null
}

const getIsStackingLocation = (
  newLocation: string,
  labwareEntities: LabwareEntities
): boolean => {
  return labwareEntities[newLocation] != null
}

const getIsAdditionalEquipmentLocation = (
  newLocation: string,
  wasteChuteEntities: WasteChuteEntities,
  trashBinEntities: TrashBinEntities,
  stagingAreaEntities: StagingAreaEntities
): boolean => {
  const stagingAreaCutoutIds = Object.values(stagingAreaEntities).map(
    equipment => {
      return equipment.location ?? ''
    }
  )
  const stagingAreaAddressableAreaNames = getStagingAreaAddressableAreas(
    stagingAreaCutoutIds as CutoutId[]
  )
  const isNewLocationInTrashBin = Object.values(trashBinEntities).some(
    trash => trash.location === newLocation
  )
  const isNewLocationInWasteChute =
    Object.values(wasteChuteEntities)[0]?.location === newLocation

  const isNewLocationInStagingArea =
    stagingAreaCutoutIds != null &&
    stagingAreaAddressableAreaNames.includes(newLocation as AddressableAreaName)

  return (
    isNewLocationInWasteChute ||
    isNewLocationInStagingArea ||
    isNewLocationInTrashBin
  )
}

const getLabwareLocation = (
  state: InvariantContext,
  newLocationString: string
): LabwareLocation | null => {
  const isWasteChuteLocation =
    Object.values(state.wasteChuteEntities).find(
      aE => aE.location === newLocationString
    ) != null
  const isTrashBinLocation =
    Object.values(state.trashBinEntities).find(
      aE => aE.location === newLocationString
    ) != null

  if (newLocationString === 'offDeck') {
    return 'offDeck'
  } else if (state.moduleEntities[newLocationString] != null) {
    return { moduleId: newLocationString }
  } else if (
    newLocationString != null &&
    getIsStackingLocation(newLocationString, state.labwareEntities)
  ) {
    return { labwareId: newLocationString }
  } else if (
    getIsAdditionalEquipmentLocation(
      newLocationString,
      state.wasteChuteEntities,
      state.trashBinEntities,
      state.stagingAreaEntities
    )
  ) {
    let addressableAreaName: AddressableAreaName =
      newLocationString as AddressableAreaName
    if (isWasteChuteLocation) {
      addressableAreaName = 'gripperWasteChute'
    } else if (isTrashBinLocation) {
      addressableAreaName = getTrashBinAddressableAreaName(
        newLocationString as CutoutId
      )
    }
    return { addressableAreaName }
  } else if (getIsSlotAVacuumDock(newLocationString)) {
    return { addressableAreaName: newLocationString as AddressableAreaName }
  } else {
    return { slotName: newLocationString }
  }
}

const getPipetteEntity = (
  state: InvariantContext,
  id: string
): PipetteEntity | null => {
  return state.pipetteEntities[id] || null
}

const getTipRackDefinition = (
  state: InvariantContext,
  tiprackDefURI: string,
  allLabwareDefs: LabwareDefByDefURI
): TipRackWithDef => {
  return { tiprackDefURI: tiprackDefURI, ...allLabwareDefs[tiprackDefURI] }
}

interface StepFieldHelpers<ValueCasterT extends ValueCaster<any, any>> {
  // todo(mm, 2025-10-09): Refine this type to also parametrize the exact types of the
  // masked value and hydrated value.
  maskValue?: ValueMasker
  hydrate?: (
    state: InvariantContext,
    id: string,
    allLabwareDefs: LabwareDefByDefURI
  ) => unknown
  castValue?: ValueCasterT
}

/**
 * Construct a `StepFieldHelpers`.
 *
 * This is just a pass-through, for the benefit of type-checking the props of each
 * `StepFieldHelpers` when we construct a bunch of them inside `stepFieldHelperMap`.
 */
function stepFieldHelpers<StepFieldHelpersT extends StepFieldHelpers<any>>(
  input: StepFieldHelpersT
): StepFieldHelpersT {
  return input
}

// The processing steps to perform on each field, if any.
//
// Each key should be a `StepFieldName` and each value should be a `StepFieldHelpers`.
// There's no type annotation up top here because we want TypeScript to infer the exact
// type of each value separately.
const stepFieldHelperMap = {
  aspirate_airGap_volume: stepFieldHelpers({
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  }),
  aspirate_labware: stepFieldHelpers({
    hydrate: getLabwareOrAdditionalEquipmentEntity,
  }),
  aspirate_mix_times: stepFieldHelpers({
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers, defaultTo(1)),
    castValue: Number,
  }),
  aspirate_mix_volume: stepFieldHelpers({
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  }),
  aspirate_mmFromBottom: stepFieldHelpers({
    castValue: numberOrNull,
  }),
  aspirate_wells: stepFieldHelpers({
    maskValue: defaultTo([]),
  }),
  dispense_airGap_volume: stepFieldHelpers({
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  }),
  dispense_labware: stepFieldHelpers({
    hydrate: getLabwareOrAdditionalEquipmentEntity,
  }),
  dispense_mix_times: stepFieldHelpers({
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers, defaultTo(1)),
    castValue: Number,
  }),
  dispense_mix_volume: stepFieldHelpers({
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  }),
  dispense_mmFromBottom: stepFieldHelpers({
    castValue: numberOrNull,
  }),
  dispense_wells: stepFieldHelpers({
    maskValue: defaultTo([]),
  }),
  disposalVolume_volume: stepFieldHelpers({
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  }),
  labware: stepFieldHelpers({
    hydrate: getLabwareOrAdditionalEquipmentEntity,
  }),
  aspirate_delay_checkbox: stepFieldHelpers({}),
  aspirate_delay_seconds: stepFieldHelpers({
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  }),
  aspirate_delay_mmFromBottom: stepFieldHelpers({
    castValue: numberOrNull,
  }),
  aspirate_touchTip_speed: stepFieldHelpers({
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: Number,
  }),
  dispense_touchTip_speed: stepFieldHelpers({
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: Number,
  }),
  aspirate_touchTip_mmFromEdge: stepFieldHelpers({
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: Number,
  }),
  dispense_touchTip_mmFromEdge: stepFieldHelpers({
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: Number,
  }),
  dispense_delay_seconds: stepFieldHelpers({
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  }),
  dispense_delay_mmFromBottom: stepFieldHelpers({
    castValue: numberOrNull,
  }),
  aspirate_submerge_delay_seconds: stepFieldHelpers({
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: Number,
  }),
  aspirate_retract_delay_seconds: stepFieldHelpers({
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: Number,
  }),
  dispense_submerge_delay_seconds: stepFieldHelpers({
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: Number,
  }),
  dispense_retract_delay_seconds: stepFieldHelpers({
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: Number,
  }),
  pipette: stepFieldHelpers({
    hydrate: getPipetteEntity,
  }),
  tipRack: stepFieldHelpers({ hydrate: getTipRackDefinition }),
  times: stepFieldHelpers({
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers, defaultTo(0)),
    castValue: Number,
  }),
  volume: stepFieldHelpers({
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1),
      defaultTo(0)
    ),
    castValue: Number,
  }),
  wells: stepFieldHelpers({
    maskValue: defaultTo([]),
  }),
  engageHeight: stepFieldHelpers({
    maskValue: composeMaskers(maskToFloat, trimDecimals(1)),
    castValue: Number,
  }),
  targetTemperature: stepFieldHelpers({
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  }),
  targetHeaterShakerTemperature: stepFieldHelpers({
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  }),
  targetSpeed: stepFieldHelpers({
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  }),
  heaterShakerTimer: stepFieldHelpers({
    maskValue: composeMaskers(maskToTime),
    castValue: String,
  }),
  pauseTime: stepFieldHelpers({
    maskValue: composeMaskers(maskToTime),
    castValue: String,
  }),
  pauseTemperature: stepFieldHelpers({
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  }),
  blockTargetTemp: stepFieldHelpers({
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  }),
  lidTargetTemp: stepFieldHelpers({
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  }),
  profileVolume: stepFieldHelpers({
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
  }),
  mix_mmFromBottom: stepFieldHelpers({
    castValue: numberOrNull,
  }),
  newLocation: stepFieldHelpers({
    hydrate: getLabwareLocation,
  }),
  aspirate_flowRate: stepFieldHelpers({
    maskValue: composeMaskers(trimDecimals(1)),
    castValue: numberOrNull,
  }),
  dispense_flowRate: stepFieldHelpers({
    maskValue: composeMaskers(trimDecimals(1)),
    castValue: numberOrNull,
  }),
  mix_flowRate: stepFieldHelpers({
    maskValue: composeMaskers(trimDecimals(1)),
    castValue: numberOrNull,
  }),
  blowout_flowRate: stepFieldHelpers({
    maskValue: composeMaskers(trimDecimals(1)),
    castValue: numberOrNull,
  }),
  pushOut_volume: stepFieldHelpers({
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: numberOrNull,
  }),
  aspirate_submerge_speed: stepFieldHelpers({
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: numberOrNull,
  }),
  aspirate_retract_speed: stepFieldHelpers({
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: numberOrNull,
  }),
  dispense_submerge_speed: stepFieldHelpers({
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: numberOrNull,
  }),
  dispense_retract_speed: stepFieldHelpers({
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: numberOrNull,
  }),
  conditioning_volume: stepFieldHelpers({
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: numberOrNull,
  }),
  pumpDurationTime: stepFieldHelpers({
    maskValue: composeMaskers(maskToTimeWithPlaceholders),
  }),
  pressureMbar: stepFieldHelpers({
    maskValue: composeMaskers(maskToSignedDecimal),
    castValue: numberOrNull,
  }),
}

export function castField<
  FieldNameT extends string | number | symbol,
  UncastValueT,
>(name: FieldNameT, value: UncastValueT): GetCastFieldType<FieldNameT> {
  const fieldCaster =
    // @ts-expect-error - TS doesn't want to let us index stepFieldHelperMap with a
    // name that it doesn't necessarily contain. It's OK here because it'll just
    // return undefined in the worst case, which this line handles.
    stepFieldHelperMap[name] && stepFieldHelperMap[name].castValue
  return fieldCaster ? fieldCaster(value) : value
}

export const maskField = (name: StepFieldName, value: unknown): unknown => {
  const fieldMasker =
    // @ts-expect-error - TS doesn't want to let us index stepFieldHelperMap with a
    // name that it doesn't necessarily contain. It's OK here because it'll just
    // return undefined in the worst case, which this line handles.
    stepFieldHelperMap[name] && stepFieldHelperMap[name].maskValue
  return fieldMasker ? fieldMasker(value) : value
}

export const hydrateField = (
  state: InvariantContext,
  name: StepFieldName,
  value: string,
  allLabwareDefs: LabwareDefByDefURI
): unknown => {
  const hydrator =
    // @ts-expect-error - TS doesn't want to let us index stepFieldHelperMap with a
    // name that it doesn't necessarily contain. It's OK here because it'll just
    // return undefined in the worst case, which this line handles.
    stepFieldHelperMap[name] && stepFieldHelperMap[name].hydrate
  return hydrator ? hydrator(state, value, allLabwareDefs) : value
}

/**
 * Returns the type that a field would have in `HydratedFormData`,
 * assuming that field is being accessed on a form type where it actually exists.
 */
type GetHydratedFieldType<FieldNameT extends string | number | symbol> =
  AmalgamateUnion<HydratedFormData> extends {
    [Key in FieldNameT]: infer HydratedValueT
  }
    ? HydratedValueT
    : never // This should only happen if FieldNameT is an unrecognized field.

/**
 * Returns the type that a field would have after being passed through `castField`.
 */
export type GetCastFieldType<FieldNameT extends string | number | symbol> =
  typeof stepFieldHelperMap extends {
    [Key in FieldNameT]: {
      castValue: (hydratedValue: any) => infer CastValueT
    }
  }
    ? CastValueT
    : GetHydratedFieldType<FieldNameT>

/**
 * Returns what a given `HydratedFormData` type would be transformed to
 * after running `castField` on all of its fields.
 */
export type GetCastFormData<HydratedFormDataT extends HydratedFormData> = {
  [Key in keyof HydratedFormDataT]: GetCastFieldType<Key>
}
