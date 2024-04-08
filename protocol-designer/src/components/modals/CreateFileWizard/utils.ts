import {
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { isModuleWithCollisionIssue } from '../../modules'
import { STANDARD_EMPTY_SLOTS } from './StagingAreaTile'

import type { DeckConfiguration, ModuleType } from '@opentrons/shared-data'
import type { FormModules } from '../../../step-forms'
import type { AdditionalEquipment, FormState } from './types'

export const FLEX_TRASH_DEFAULT_SLOT = 'cutoutA3'

const MODULES_SLOTS_FLEX = [
  {
    value: 'cutoutD1',
    slot: 'D1',
  },
  {
    value: 'cutoutC3',
    slot: 'C3',
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
    value: 'cutoutA3',
    slot: 'A3',
  },
  {
    value: 'cutoutD3',
    slot: 'D3',
  },
  {
    value: 'cutoutC1',
    slot: 'C1',
  },
  {
    value: 'cutoutA1',
    slot: 'A1',
  },
]

export const getCrashableModuleSelected = (
  modules: FormModules | null,
  moduleType: ModuleType
): boolean => {
  if (modules == null) return false

  const formModule = Object.values(modules).find(
    module => module.type === moduleType
  )
  const crashableModuleOnDeck =
    formModule?.model != null
      ? isModuleWithCollisionIssue(formModule.model)
      : false

  return crashableModuleOnDeck
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

export const getUnoccupiedStagingAreaSlots = (
  modules: FormState['modules']
): DeckConfiguration => {
  let unoccupiedSlots = STANDARD_EMPTY_SLOTS
  const moduleCutoutIds =
    modules != null
      ? Object.values(modules).flatMap(module =>
          module.type === THERMOCYCLER_MODULE_TYPE
            ? [`cutout${module.slot}`, 'cutoutA1']
            : `cutout${module.slot}`
        )
      : []

  unoccupiedSlots = unoccupiedSlots.filter(emptySlot => {
    return !moduleCutoutIds.includes(emptySlot.cutoutId)
  })

  return unoccupiedSlots
}

export const getNextAvailableModuleSlot = (
  modules: FormState['modules'],
  additionalEquipment: FormState['additionalEquipment']
): string => {
  const moduleSlots =
    modules != null
      ? Object.values(modules).flatMap(module =>
          module.type === THERMOCYCLER_MODULE_TYPE
            ? [module.slot, 'A1']
            : module.slot
        )
      : []
  const stagingAreas = additionalEquipment.filter(equipment =>
    equipment.includes('stagingArea')
  )
  const stagingAreaCutouts = stagingAreas.map(cutout => cutout.split('_')[1])
  const hasWasteChute = additionalEquipment.find(equipment =>
    equipment.includes('wasteChute')
  )
  const wasteChuteSlot = Boolean(hasWasteChute)
    ? [WASTE_CHUTE_CUTOUT as string]
    : []
  const trashBin = additionalEquipment.find(equipment =>
    equipment.includes('trashBin')
  )
  const hasTC =
    modules != null
      ? Object.values(modules).some(
          module => module.type === THERMOCYCLER_MODULE_TYPE
        )
      : false

  //  removing slot(s) for the trash if spaces are limited
  let removeSlotForTrash = MODULES_SLOTS_FLEX
  if (trashBin != null && hasTC) {
    removeSlotForTrash = MODULES_SLOTS_FLEX.slice(0, -2)
  } else if (trashBin != null && !hasTC) {
    removeSlotForTrash = MODULES_SLOTS_FLEX.slice(0, -1)
  }
  const unoccupiedSlot = removeSlotForTrash.find(
    cutout =>
      !stagingAreaCutouts.includes(cutout.value) &&
      !moduleSlots.includes(cutout.slot) &&
      !wasteChuteSlot.includes(cutout.value)
  )
  if (unoccupiedSlot == null) {
    return ''
  }

  return unoccupiedSlot?.slot ?? ''
}

interface DisabledEquipmentProps {
  additionalEquipment: AdditionalEquipment[]
  modules: FormModules | null
}

export const getDisabledEquipment = (
  props: DisabledEquipmentProps
): string[] => {
  const { additionalEquipment, modules } = props
  const nextAvailableSlot = getNextAvailableModuleSlot(
    modules,
    additionalEquipment
  )
  const disabledEquipment: string[] = []

  const moduleSlots =
    modules != null
      ? Object.values(modules).flatMap(module =>
          module.type === THERMOCYCLER_MODULE_TYPE
            ? [module.slot, 'A1']
            : module.slot
        )
      : []

  if (moduleSlots.includes('A1') || moduleSlots.includes('B1')) {
    disabledEquipment.push(THERMOCYCLER_MODULE_TYPE)
  }
  if (nextAvailableSlot === '') {
    disabledEquipment.push(TEMPERATURE_MODULE_TYPE, HEATERSHAKER_MODULE_TYPE)
  }

  return disabledEquipment
}

export const getTrashBinOptionDisabled = (
  props: DisabledEquipmentProps
): boolean => {
  const { additionalEquipment, modules } = props
  const nextAvailableSlot = getNextAvailableModuleSlot(
    modules,
    additionalEquipment
  )
  const hasTrashBinAlready = additionalEquipment.includes('trashBin')
  return nextAvailableSlot === '' && !hasTrashBinAlready
}

export const getTrashSlot = (values: FormState): string => {
  const { additionalEquipment, modules } = values
  const moduleSlots =
    modules != null
      ? Object.values(modules).flatMap(module =>
          module.type === THERMOCYCLER_MODULE_TYPE
            ? [module.slot, 'A1']
            : module.slot
        )
      : []
  const stagingAreas = additionalEquipment.filter(equipment =>
    equipment.includes('stagingArea')
  )
  //  TODO(Jr, 11/16/23): refactor additionalEquipment to store cutouts
  //  so the split isn't needed
  const cutouts = stagingAreas.map(cutout => cutout.split('_')[1])
  const hasWasteChute = additionalEquipment.find(equipment =>
    equipment.includes('wasteChute')
  )
  const wasteChuteSlot = Boolean(hasWasteChute)
    ? [WASTE_CHUTE_CUTOUT as string]
    : []

  if (
    !cutouts.includes(FLEX_TRASH_DEFAULT_SLOT) &&
    !moduleSlots.includes('A3')
  ) {
    return FLEX_TRASH_DEFAULT_SLOT
  }

  const unoccupiedSlot = MOVABLE_TRASH_CUTOUTS.find(
    cutout =>
      !cutouts.includes(cutout.value) &&
      !moduleSlots.includes(cutout.slot) &&
      !wasteChuteSlot.includes(cutout.value)
  )
  if (unoccupiedSlot == null) {
    console.error(
      'Expected to find an unoccupied slot for the trash bin but could not'
    )
    return ''
  }

  return unoccupiedSlot?.value
}
