import { getStagingAreaAddressableAreas } from '../../utils'
import {
  composeMaskers,
  defaultTo,
  maskToFloat,
  maskToInteger,
  maskToTime,
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
  WasteChuteEntities,
} from '@opentrons/step-generation'
import type {
  LabwareOrAdditionalEquipmentEntity,
  StepFieldName,
} from '../../form-types'
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

const getIsAdapterLocation = (
  newLocation: string,
  labwareEntities: LabwareEntities
): boolean => {
  if (labwareEntities[newLocation] == null) {
    return false
  }
  return (
    labwareEntities[newLocation].def.allowedRoles?.includes('adapter') ?? false
  )
}
const getIsAdditionalEquipmentLocation = (
  newLocation: string,
  wasteChuteEntities: WasteChuteEntities,
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

  const isNewLocationInWasteChute =
    Object.values(wasteChuteEntities)[0]?.location === newLocation

  const isNewLocationInStagingArea =
    stagingAreaCutoutIds != null &&
    stagingAreaAddressableAreaNames.includes(newLocation as AddressableAreaName)

  return isNewLocationInWasteChute || isNewLocationInStagingArea
}

const getLabwareLocation = (
  state: InvariantContext,
  newLocationString: string
): LabwareLocation | null => {
  const isWasteChuteLocation =
    Object.values(state.wasteChuteEntities).find(
      aE => aE.location === newLocationString
    ) != null

  if (newLocationString === 'offDeck') {
    return 'offDeck'
  } else if (state.moduleEntities[newLocationString] != null) {
    return { moduleId: newLocationString }
  } else if (
    newLocationString != null &&
    getIsAdapterLocation(newLocationString, state.labwareEntities)
  ) {
    return { labwareId: newLocationString }
  } else if (
    getIsAdditionalEquipmentLocation(
      newLocationString,
      state.wasteChuteEntities,
      state.stagingAreaEntities
    )
  ) {
    return {
      addressableAreaName: isWasteChuteLocation
        ? 'gripperWasteChute'
        : // TODO(bh, 2024-01-02): check new location against addressable areas via the deck definition
          (newLocationString as AddressableAreaName),
    }
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

interface StepFieldHelpers {
  maskValue?: ValueMasker
  castValue?: ValueCaster
  hydrate?: (state: InvariantContext, id: string) => unknown
}
const stepFieldHelperMap: Record<StepFieldName, StepFieldHelpers> = {
  aspirate_airGap_volume: {
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  },
  aspirate_labware: {
    hydrate: getLabwareOrAdditionalEquipmentEntity,
  },
  aspirate_mix_times: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers, defaultTo(1)),
    castValue: Number,
  },
  aspirate_mix_volume: {
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  },
  aspirate_mmFromBottom: {
    castValue: Number,
  },
  aspirate_wells: {
    maskValue: defaultTo([]),
  },
  dispense_airGap_volume: {
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  },
  dispense_labware: {
    hydrate: getLabwareOrAdditionalEquipmentEntity,
  },
  dispense_mix_times: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers, defaultTo(1)),
    castValue: Number,
  },
  dispense_mix_volume: {
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  },
  dispense_mmFromBottom: {
    castValue: Number,
  },
  dispense_wells: {
    maskValue: defaultTo([]),
  },
  disposalVolume_volume: {
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  },
  labware: {
    hydrate: getLabwareOrAdditionalEquipmentEntity,
  },
  aspirate_delay_seconds: {
    maskValue: composeMaskers(
      maskToInteger,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  },
  aspirate_delay_mmFromBottom: {
    castValue: numberOrNull,
  },
  aspirate_touchTip_speed: {
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: Number,
  },
  dispense_touchTip_speed: {
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: Number,
  },
  aspirate_touchTip_mmFromEdge: {
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: Number,
  },
  dispense_touchTip_mmFromEdge: {
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: Number,
  },
  dispense_delay_seconds: {
    maskValue: composeMaskers(
      maskToInteger,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  },
  dispense_delay_mmFromBottom: {
    castValue: numberOrNull,
  },
  aspirate_submerge_delay_seconds: {
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
  },
  aspirate_retract_delay_seconds: {
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
  },
  dispense_submerge_delay_seconds: {
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
  },
  dispense_retract_delay_seconds: {
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
  },
  pipette: {
    hydrate: getPipetteEntity,
  },
  times: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers, defaultTo(0)),
    castValue: Number,
  },
  volume: {
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1),
      defaultTo(0)
    ),
    castValue: Number,
  },
  wells: {
    maskValue: defaultTo([]),
  },
  engageHeight: {
    maskValue: composeMaskers(maskToFloat, trimDecimals(1)),
    castValue: Number,
  },
  targetTemperature: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  targetHeaterShakerTemperature: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  targetSpeed: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  heaterShakerTimer: {
    maskValue: composeMaskers(maskToTime),
    castValue: String,
  },
  pauseTime: {
    maskValue: composeMaskers(maskToTime),
    castValue: String,
  },
  pauseTemperature: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  blockTargetTemp: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  lidTargetTemp: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  profileVolume: {
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
  },
  blockTargetTempHold: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  lidTargetTempHold: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  mix_mmFromBottom: {
    castValue: Number,
  },
  newLocation: {
    hydrate: getLabwareLocation,
  },
  aspirate_flowRate: {
    maskValue: composeMaskers(trimDecimals(1)),
    castValue: numberOrNull,
  },
  dispense_flowRate: {
    maskValue: composeMaskers(trimDecimals(1)),
    castValue: numberOrNull,
  },
  mix_flowRate: {
    maskValue: composeMaskers(trimDecimals(1)),
    castValue: numberOrNull,
  },
  blowout_flowRate: {
    maskValue: composeMaskers(trimDecimals(1)),
    castValue: numberOrNull,
  },
  pushOut_volume: {
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: numberOrNull,
  },
  aspirate_submerge_speed: {
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: numberOrNull,
  },
  aspirate_retract_speed: {
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: numberOrNull,
  },
  dispense_submerge_speed: {
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: numberOrNull,
  },
  dispense_retract_speed: {
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: numberOrNull,
  },
  conditioning_volume: {
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: numberOrNull,
  },
}
export const castField = (name: StepFieldName, value: unknown): unknown => {
  const fieldCaster =
    stepFieldHelperMap[name] && stepFieldHelperMap[name].castValue
  return fieldCaster ? fieldCaster(value) : value
}
export const maskField = (name: StepFieldName, value: unknown): unknown => {
  const fieldMasker =
    stepFieldHelperMap[name] && stepFieldHelperMap[name].maskValue
  return fieldMasker ? fieldMasker(value) : value
}
export const hydrateField = (
  state: InvariantContext,
  name: StepFieldName,
  value: string
): unknown => {
  const hydrator = stepFieldHelperMap[name] && stepFieldHelperMap[name].hydrate
  return hydrator ? hydrator(state, value) : value
}
