import {
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { COLUMN_3_SLOTS } from '../../../constants'
import { OUTER_SLOTS_FLEX } from '../../../modules'
import { isModuleWithCollisionIssue } from '../../modules'
import {
  FLEX_SUPPORTED_MODULE_MODELS,
  DEFAULT_SLOT_MAP,
} from './ModulesAndOtherTile'

import type { ModuleType } from '@opentrons/shared-data'
import type { FormModulesByType } from '../../../step-forms'
import type { FormState } from './types'

export const FLEX_TRASH_DEFAULT_SLOT = 'A3'
const ALL_STAGING_AREAS = 4

export const getLastCheckedEquipment = (values: FormState): string | null => {
  const hasAllStagingAreas =
    values.additionalEquipment.filter(equipment =>
      equipment.includes('stagingArea')
    ).length === ALL_STAGING_AREAS
  const hasTrashBin = values.additionalEquipment.includes('trashBin')

  if (!hasTrashBin || !hasAllStagingAreas) {
    return null
  }

  if (
    values.modulesByType.heaterShakerModuleType.onDeck &&
    values.modulesByType.thermocyclerModuleType.onDeck
  ) {
    return TEMPERATURE_MODULE_TYPE
  }

  if (
    values.modulesByType.heaterShakerModuleType.onDeck &&
    values.modulesByType.temperatureModuleType.onDeck
  ) {
    return THERMOCYCLER_MODULE_TYPE
  }

  if (
    values.modulesByType.thermocyclerModuleType.onDeck &&
    values.modulesByType.temperatureModuleType.onDeck
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

export const getTrashBinOptionDisabled = (values: FormState): boolean => {
  const allStagingAreasInUse =
    values.additionalEquipment.filter(equipment =>
      equipment.includes('stagingArea')
    ).length === ALL_STAGING_AREAS

  const allModulesInSideSlotsOnDeck =
    values.modulesByType.heaterShakerModuleType.onDeck &&
    values.modulesByType.thermocyclerModuleType.onDeck &&
    values.modulesByType.temperatureModuleType.onDeck

  return allStagingAreasInUse && allModulesInSideSlotsOnDeck
}

export const getTrashSlot = (values: FormState): string => {
  const stagingAddressableAreas = values.additionalEquipment.filter(equipment =>
    equipment.includes('stagingArea')
  )
  const cutouts = stagingAddressableAreas.flatMap(aa =>
    COLUMN_3_SLOTS.filter(cutout => aa.includes(cutout))
  )

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
  const unoccupiedSlot = OUTER_SLOTS_FLEX.find(
    slot => !cutouts.includes(slot.value) && !moduleSlots.includes(slot.value)
  )
  if (unoccupiedSlot == null) {
    console.error(
      'Expected to find an unoccupied slot for the trash bin but could not'
    )
    return ''
  }

  return unoccupiedSlot?.value
}
