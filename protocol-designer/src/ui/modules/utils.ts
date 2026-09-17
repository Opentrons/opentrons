import values from 'lodash/values'

import {
  ABSORBANCE_READER_TYPE,
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getLabwareDefaultEngageHeight,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_LOCATION,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import {
  getLabwareIdAfterModuleIdInStack,
  getLabwaresOnModuleFromStack,
} from '../../utils'

import type { DropdownOption } from '@opentrons/components'
import type { ModuleType, RobotType } from '@opentrons/shared-data'
import type {
  InitialDeckSetup,
  LabwareOnDeck,
  ModuleOnDeck,
} from '../../step-forms/types'

export function getModuleOnDeckByType(
  initialDeckSetup: InitialDeckSetup,
  type: ModuleType
): ModuleOnDeck | null | undefined {
  return values(initialDeckSetup.modules).find(
    (moduleOnDeck: ModuleOnDeck) => moduleOnDeck.type === type
  )
}
export function getModulesOnDeckByType(
  initialDeckSetup: InitialDeckSetup,
  type: ModuleType
): ModuleOnDeck[] | null | undefined {
  return values(initialDeckSetup.modules).filter(
    (moduleOnDeck: ModuleOnDeck) => moduleOnDeck.type === type
  )
}
export function getLabwareOnModule(
  initialDeckSetup: InitialDeckSetup,
  moduleId: string
): LabwareOnDeck | null | undefined {
  const labwareId = getLabwareIdAfterModuleIdInStack(
    moduleId,
    initialDeckSetup.labware
  )
  return labwareId != null ? initialDeckSetup.labware[labwareId] : null
}

export const getModuleShortNames = (type: ModuleType): string => {
  switch (type) {
    case HEATERSHAKER_MODULE_TYPE:
      return 'Heater-Shaker Module'
    case MAGNETIC_BLOCK_TYPE:
      return 'Magnetic Block'
    case MAGNETIC_MODULE_TYPE:
      return 'Magnetic Module'
    case TEMPERATURE_MODULE_TYPE:
      return 'Temperature Module'
    case THERMOCYCLER_MODULE_TYPE:
      return 'Thermocycler'
    case ABSORBANCE_READER_TYPE:
      return 'Absorbance Plate Reader'
    case FLEX_STACKER_MODULE_TYPE:
      return 'Flex Stacker'
    case VACUUM_MODULE_TYPE:
      return 'Vacuum Module'
    default:
      console.warn(
        `unsupported module ${type} - need to add to getModuleShortNames`
      )
      return 'unsupported module'
  }
}

export const getModuleDisplayLocation = (
  moduleOnDeck: ModuleOnDeck,
  robotType: RobotType
): string => {
  const { type, slot } = moduleOnDeck
  if (type === THERMOCYCLER_MODULE_TYPE) {
    return robotType === FLEX_ROBOT_TYPE
      ? TC_MODULE_LOCATION_OT3
      : TC_MODULE_LOCATION_OT2
  }
  if (type === VACUUM_MODULE_TYPE) {
    return VACUUM_MODULE_LOCATION
  }
  return slot
}

export function getModuleLabwareOptions(
  initialDeckSetup: InitialDeckSetup,
  nicknamesById: Record<string, string>,
  type: ModuleType,
  robotType: RobotType
): DropdownOption[] {
  const labwares = initialDeckSetup.labware
  const modulesOnDeck = getModulesOnDeckByType(initialDeckSetup, type)
  const module = getModuleShortNames(type)
  let options: DropdownOption[] = []

  if (modulesOnDeck != null) {
    options = modulesOnDeck.map(moduleOnDeck => {
      const { topMostId } = getLabwaresOnModuleFromStack(
        moduleOnDeck.id,
        Object.values(labwares)
      )
      const moduleDisplayLocation = getModuleDisplayLocation(
        moduleOnDeck,
        robotType
      )
      if (topMostId != null) {
        return {
          name: nicknamesById[topMostId],
          deckLabel: moduleDisplayLocation,
          subtext: module,
          value: moduleOnDeck.id,
        }
      } else {
        return {
          name: module,
          deckLabel: moduleDisplayLocation,
          value: moduleOnDeck.id,
        }
      }
    })
  }

  return options
}
export function getModuleHasLabware(
  initialDeckSetup: InitialDeckSetup,
  type: ModuleType
): boolean {
  const moduleOnDeck = getModuleOnDeckByType(initialDeckSetup, type)
  const labware =
    moduleOnDeck && getLabwareOnModule(initialDeckSetup, moduleOnDeck.id)
  return Boolean(moduleOnDeck) && Boolean(labware)
}

export interface ModuleAndLabware {
  moduleId: string
  hasLabware: boolean
}

export function getModulesHaveLabware(
  initialDeckSetup: InitialDeckSetup,
  type: ModuleType
): ModuleAndLabware[] {
  const modulesOnDeck = getModulesOnDeckByType(initialDeckSetup, type)
  const moduleAndLabware: ModuleAndLabware[] = []
  modulesOnDeck?.forEach(module => {
    const labwareHasModule = getLabwareOnModule(initialDeckSetup, module.id)

    moduleAndLabware.push({
      moduleId: module.id,
      hasLabware: labwareHasModule != null,
    })
  })
  return moduleAndLabware
}

export const getMagnetLabwareEngageHeight = (
  initialDeckSetup: InitialDeckSetup,
  magnetModuleId: string | null
): number | null => {
  if (magnetModuleId == null) return null
  const moduleModel = initialDeckSetup.modules[magnetModuleId]?.model
  const labware = getLabwareOnModule(initialDeckSetup, magnetModuleId)
  const engageHeightMm = labware
    ? getLabwareDefaultEngageHeight(labware.def)
    : null

  if (engageHeightMm != null && moduleModel === MAGNETIC_MODULE_V1) {
    // convert to 'short mm' units for GEN1
    return engageHeightMm * 2
  }

  return engageHeightMm
}
