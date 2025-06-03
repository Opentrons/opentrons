import reduce from 'lodash/reduce'
import some from 'lodash/some'

import {
  FIXED_TRASH_ID,
  FLEX_ROBOT_TYPE,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
  WASTE_CHUTE_ADDRESSABLE_AREAS,
} from '@opentrons/shared-data'

import { getStagingAreaAddressableAreas } from '../../utils'
import { LID_LOADNAMES, TIPRACK_LID_LOADNAME } from '../Designer/utils'

import type {
  AddressableAreaName,
  CreateCommand,
  CutoutId,
  RobotType,
} from '@opentrons/shared-data'
import type {
  InitialDeckSetup,
  LabwareOnDeck,
  SavedStepFormState,
} from '../../step-forms'

interface AdditionalEquipment {
  [additionalEquipmentId: string]: {
    name: 'gripper' | 'wasteChute' | 'stagingArea' | 'trashBin'
    id: string
    location?: string
  }
}

/** Pull out all entities never specified by step forms. Assumes that all forms share the entityKey */
export function getUnusedEntities<T>(
  entities: Record<string, T>,
  stepForms: SavedStepFormState,
  entityKey: 'pipette' | 'moduleId',
  robotType: RobotType
): T[] {
  const unusedEntities = reduce(
    entities,
    (acc, entity: T, entityId): T[] => {
      const stepContainsEntity = some(
        stepForms,
        form => form[entityKey] === entityId
      )

      if (
        robotType === FLEX_ROBOT_TYPE &&
        entityKey === 'moduleId' &&
        (entity as any).type === 'magneticBlockType'
      ) {
        return acc
      }

      return stepContainsEntity ? acc : [...acc, entity]
    },
    [] as T[]
  )

  return unusedEntities
}

export const getUnusedStagingAreas = (
  additionalEquipment: AdditionalEquipment,
  commands?: CreateCommand[]
): string[] => {
  const stagingAreaCutoutIds = Object.values(additionalEquipment)
    .filter(equipment => equipment?.name === 'stagingArea')
    .map(equipment => {
      return equipment.location ?? ''
    })

  const stagingAreaAddressableAreaNames = getStagingAreaAddressableAreas(
    //  TODO(jr, 11/13/23): fix AdditionalEquipment['location'] from type string to CutoutId
    stagingAreaCutoutIds as CutoutId[]
  )

  const stagingAreaCommandSlots: string[] = stagingAreaAddressableAreaNames.filter(
    location =>
      (commands ?? [])?.some(
        command =>
          (command.commandType === 'loadLabware' &&
            command.params.location !== 'offDeck' &&
            command.params.location !== 'systemLocation' &&
            'addressableAreaName' in command.params.location &&
            command.params.location.addressableAreaName === location) ||
          (command.commandType === 'moveLabware' &&
            command.params.newLocation !== 'offDeck' &&
            command.params.newLocation !== 'systemLocation' &&
            'addressableAreaName' in command.params.newLocation &&
            command.params.newLocation.addressableAreaName === location)
      )
        ? null
        : location
  )
  return stagingAreaCommandSlots
}

interface UnusedTrash {
  trashBinUnused: boolean
  wasteChuteUnused: boolean
}

export const getUnusedTrash = (
  additionalEquipment: InitialDeckSetup['additionalEquipmentOnDeck'],
  commands?: CreateCommand[]
): UnusedTrash => {
  const trashBin = Object.values(additionalEquipment).find(
    aE => aE.name === 'trashBin'
  )

  const hasTrashBinCommands =
    trashBin != null
      ? commands?.some(
          command =>
            (command.commandType === 'moveToAddressableArea' &&
              (MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(
                command.params.addressableAreaName as AddressableAreaName
              ) ||
                command.params.addressableAreaName === FIXED_TRASH_ID)) ||
            command.commandType === 'moveToAddressableAreaForDropTip'
        )
      : null
  const wasteChute = Object.values(additionalEquipment).find(
    aE => aE.name === 'wasteChute'
  )
  const hasWasteChuteCommands =
    wasteChute != null
      ? commands?.some(
          command =>
            (command.commandType === 'moveToAddressableArea' &&
              WASTE_CHUTE_ADDRESSABLE_AREAS.includes(
                command.params.addressableAreaName as AddressableAreaName
              )) ||
            (command.commandType === 'moveLabware' &&
              command.params.newLocation !== 'offDeck' &&
              command.params.newLocation !== 'systemLocation' &&
              'addressableAreaName' in command.params.newLocation &&
              command.params.newLocation.addressableAreaName ===
                'gripperWasteChute')
        )
      : null
  return {
    trashBinUnused: trashBin != null && !hasTrashBinCommands,
    wasteChuteUnused: wasteChute != null && !hasWasteChuteCommands,
  }
}

export const getShowTCLid = (labware: LabwareOnDeck): boolean => {
  const compatibleParentLabware = labware.def.compatibleParentLabware
  const filteredCompatibleParentlabware = compatibleParentLabware?.filter(
    parent =>
      parent !== 'opentrons_tough_pcr_auto_sealing_lid' &&
      parent !== 'opentrons_flex_deck_riser'
  )
  const showTCLid = filteredCompatibleParentlabware?.some(parent =>
    labware.stack.some(id => id.includes(parent))
  )

  return !showTCLid
    ? labware.def.parameters.loadName === TIPRACK_LID_LOADNAME
    : LID_LOADNAMES.includes(labware.def.parameters.loadName)
}
