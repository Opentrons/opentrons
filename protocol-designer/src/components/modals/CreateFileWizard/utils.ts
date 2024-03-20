import {
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { isModuleWithCollisionIssue } from '../../modules'
import {
  FLEX_SUPPORTED_MODULE_MODELS,
  DEFAULT_SLOT_MAP,
} from './ModulesAndOtherTile'

import type { ModuleType } from '@opentrons/shared-data'
import type { FormModulesByType } from '../../../step-forms'
import type { AdditionalEquipment, FormState } from './types'

export const FLEX_TRASH_DEFAULT_SLOT = 'cutoutA3'
const ALL_STAGING_AREAS = 4

interface LastCheckedProps {
  additionalEquipment: AdditionalEquipment[]
  modulesByType: FormModulesByType
}

export const getLastCheckedEquipment = (
  props: LastCheckedProps
): string | null => {
  const { additionalEquipment, modulesByType } = props
  const hasAllStagingAreas =
    additionalEquipment.filter(equipment => equipment.includes('stagingArea'))
      .length === ALL_STAGING_AREAS
  const hasTrashBin = additionalEquipment.includes('trashBin')

  if (!hasTrashBin || !hasAllStagingAreas) {
    return null
  }

  if (
    modulesByType.heaterShakerModuleType.onDeck &&
    modulesByType.thermocyclerModuleType.onDeck
  ) {
    return TEMPERATURE_MODULE_TYPE
  }

  if (
    modulesByType.heaterShakerModuleType.onDeck &&
    modulesByType.temperatureModuleType.onDeck
  ) {
    return THERMOCYCLER_MODULE_TYPE
  }

  if (
    modulesByType.thermocyclerModuleType.onDeck &&
    modulesByType.temperatureModuleType.onDeck
  ) {
    return HEATERSHAKER_MODULE_TYPE
  }

  return null
}

export const getCrashableModuleSelected = (
  modules: FormModulesByType,
  moduleType: ModuleType
): boolean => {
  const formModule = modules[moduleType]
  const crashableModuleOnDeck =
    formModule?.onDeck && formModule?.model != null
      ? isModuleWithCollisionIssue(formModule.model)
      : false

  return crashableModuleOnDeck
}

export const getTrashBinOptionDisabled = (props: LastCheckedProps): boolean => {
  const { additionalEquipment, modulesByType } = props
  const allStagingAreasInUse =
    additionalEquipment.filter(equipment => equipment.includes('stagingArea'))
      .length === ALL_STAGING_AREAS

  const allModulesInSideSlotsOnDeck =
    modulesByType.heaterShakerModuleType.onDeck &&
    modulesByType.thermocyclerModuleType.onDeck &&
    modulesByType.temperatureModuleType.onDeck

  return allStagingAreasInUse && allModulesInSideSlotsOnDeck
}

export const MOVABLE_TRASH_CUTOUTS = [
  {
    value: 'cutoutA1',
    slot: 'A1',
  },
  {
    value: 'cutoutA3',
    slot: 'A3',
  },
  {
    value: 'cutoutB1',
    slot: 'B1',
  },
  {
    value: 'cutoutB3',
    slot: 'B3',
  },
  {
    value: 'cutoutC1',
    slot: 'C1',
  },
  {
    value: 'cutoutC3',
    slot: 'C3',
  },
  {
    value: 'cutoutD1',
    slot: 'D1',
  },
  {
    value: 'cutoutD3',
    slot: 'D3',
  },
]

export const getTrashSlot = (values: FormState): string => {
  const stagingAreas = values.additionalEquipment.filter(equipment =>
    equipment.includes('stagingArea')
  )
  //  TODO(Jr, 11/16/23): refactor additionalEquipment to store cutouts
  //  so the split isn't needed
  const cutouts = stagingAreas.map(cutout => cutout.split('_')[1])

  if (!cutouts.includes(FLEX_TRASH_DEFAULT_SLOT)) {
    return FLEX_TRASH_DEFAULT_SLOT
  }

  const moduleSlots: string[] = FLEX_SUPPORTED_MODULE_MODELS.reduce(
    (slots: string[], model) => {
      const moduleType = getModuleType(model)
      if (values.modulesByType[moduleType].onDeck) {
        const slot = String(DEFAULT_SLOT_MAP[model])
        return moduleType === THERMOCYCLER_MODULE_TYPE
          ? [...slots, 'A1', slot]
          : [...slots, slot]
      }
      return slots
    },
    []
  )
  const unoccupiedSlot = MOVABLE_TRASH_CUTOUTS.find(
    cutout =>
      !cutouts.includes(cutout.value) && !moduleSlots.includes(cutout.slot)
  )
  if (unoccupiedSlot == null) {
    console.error(
      'Expected to find an unoccupied slot for the trash bin but could not'
    )
    return ''
  }

  return unoccupiedSlot?.value
}
