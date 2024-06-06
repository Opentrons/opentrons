import {
  MAGNETIC_BLOCK_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { isModuleWithCollisionIssue } from '../../modules'
import { STANDARD_EMPTY_SLOTS } from './StagingAreaTile'

import type { DeckConfiguration, ModuleType } from '@opentrons/shared-data'
import type { FormModules } from '../../../step-forms'
import type { AdditionalEquipment, FormState } from './types'

export const FLEX_TRASH_DEFAULT_SLOT = 'cutoutA3'

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
    value: 'cutoutA3',
    slot: 'A3',
  },
  {
    value: 'cutoutA1',
    slot: 'A1',
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

const TOTAL_MODULE_SLOTS = 8

export const getNumSlotsAvailable = (
  modules: FormState['modules'],
  additionalEquipment: FormState['additionalEquipment'],
  //  special-casing the wasteChute available slots when there is a staging area in slot 3
  isWasteChute?: boolean
): number => {
  const additionalEquipmentLength = additionalEquipment.length
  const hasTC = Object.values(modules || {}).some(
    module => module.type === THERMOCYCLER_MODULE_TYPE
  )
  const hasMagneticBlock = Object.values(modules || {}).some(
    module => module.type === MAGNETIC_BLOCK_TYPE
  )
  let filteredModuleLength = modules != null ? Object.keys(modules).length : 0
  if (hasTC) {
    filteredModuleLength = filteredModuleLength + 1
  }
  if (hasMagneticBlock) {
    filteredModuleLength = filteredModuleLength - 1
  }

  const hasWasteChute = additionalEquipment.some(equipment =>
    equipment.includes('wasteChute')
  )
  const isStagingAreaInD3 = additionalEquipment
    .filter(equipment => equipment.includes('stagingArea'))
    .find(stagingArea => stagingArea.split('_')[1] === 'cutoutD3')
  const hasGripper = additionalEquipment.some(equipment =>
    equipment.includes('gripper')
  )

  let filteredAdditionalEquipmentLength = additionalEquipmentLength
  if (hasWasteChute && isStagingAreaInD3) {
    filteredAdditionalEquipmentLength = filteredAdditionalEquipmentLength - 1
  }
  if (isWasteChute && isStagingAreaInD3) {
    filteredAdditionalEquipmentLength = filteredAdditionalEquipmentLength - 1
  }
  if (hasGripper) {
    filteredAdditionalEquipmentLength = filteredAdditionalEquipmentLength - 1
  }
  return (
    TOTAL_MODULE_SLOTS -
    (filteredModuleLength + filteredAdditionalEquipmentLength)
  )
}

export const getUnoccupiedStagingAreaSlots = (
  modules: FormState['modules'],
  additionalEquipment: FormState['additionalEquipment']
): DeckConfiguration => {
  const numSlotsAvailable = getNumSlotsAvailable(modules, additionalEquipment)
  let unoccupiedSlots = STANDARD_EMPTY_SLOTS

  if (numSlotsAvailable < 4) {
    unoccupiedSlots = STANDARD_EMPTY_SLOTS.slice(0, numSlotsAvailable)
  }
  return unoccupiedSlots
}

interface TrashOptionDisabledProps {
  trashType: 'trashBin' | 'wasteChute'
  additionalEquipment: AdditionalEquipment[]
  modules: FormModules | null
}

export const getTrashOptionDisabled = (
  props: TrashOptionDisabledProps
): boolean => {
  const { additionalEquipment, modules, trashType } = props
  const hasNoSlotsAvailable =
    getNumSlotsAvailable(
      modules,
      additionalEquipment,
      trashType === 'wasteChute'
    ) === 0
  return hasNoSlotsAvailable && !additionalEquipment.includes(trashType)
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
