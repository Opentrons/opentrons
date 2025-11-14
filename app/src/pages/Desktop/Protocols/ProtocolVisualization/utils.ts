import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import sum from 'lodash/sum'
import values from 'lodash/values'

import { COLORS } from '@opentrons/components'
import {
  COLUMN,
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  isAddressableAreaStandardSlot,
  OT2_ROBOT_TYPE,
  ROW,
  SINGLE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  _wellContentsForLabware,
  getLiquidIdsOnLabware,
  getSlotInLocationStack,
  getVolumesPerLiquid,
} from '@opentrons/step-generation'

import { POTENTIAL_TRASH_COMMAND_TYPES } from './consants'

import type { ComponentProps } from 'react'
import type { Module, WellGroup } from '@opentrons/components'
import type {
  AddressableAreaName,
  CutoutId,
  LabwareDefinition2,
  Liquid,
  NozzleConfigurationStyle,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  ContentsByWell,
  DeckSlot,
  LabwareTemporalProperties,
  ModuleEntities,
  ModuleTemporalProperties,
  RobotState,
  SingleLabwareLiquidState,
} from '@opentrons/step-generation'
import type { GroupedCommands } from '/app/redux/protocol-storage'

interface LiquidDetailInfo {
  totalVolume: number
  color: string
  displayName: string
}
type WellContentsByLabware = Record<string, ContentsByWell>

export const getStagingAreaAddressableAreas = (
  cutoutIds: CutoutId[],
  filterStandardSlots: boolean = true
): AddressableAreaName[] => {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const cutoutFixtures = deckDef.cutoutFixtures

  const addressableAreasRaw = cutoutIds.flatMap(cutoutId => {
    const addressableAreasOnCutout = cutoutFixtures.find(
      cutoutFixture => cutoutFixture.id === STAGING_AREA_RIGHT_SLOT_FIXTURE
    )?.providesAddressableAreas[cutoutId]
    return addressableAreasOnCutout ?? []
  })
  if (filterStandardSlots) {
    return addressableAreasRaw.filter(
      aa => !isAddressableAreaStandardSlot(aa, deckDef)
    )
  }
  return addressableAreasRaw
}

export const getSlotIsEmpty = (
  robotState: RobotState,
  slot: string
): boolean => {
  const modulesInSlot = values(robotState.modules).filter(
    moduleTemporalProperties => {
      return slot.includes(moduleTemporalProperties.slot)
    }
  )
  const labwareInSlot = values(robotState.labware).filter(
    labwareTemporalProperties =>
      getSlotInLocationStack(labwareTemporalProperties.stack) === slot
  )

  return modulesInSlot.length === 0 && labwareInSlot.length === 0
}

export const getSlotIdsBlockedBySpanningForThermocycler = (
  modules: RobotState['modules'],
  moduleEntities: ModuleEntities,
  robotType: RobotType
): DeckSlot[] => {
  const loadedThermocycler = Object.keys(modules).find(
    id => moduleEntities[id].type === THERMOCYCLER_MODULE_TYPE
  )
  if (loadedThermocycler != null && robotType === FLEX_ROBOT_TYPE) {
    return ['A1', 'B1']
  } else if (loadedThermocycler != null && robotType === OT2_ROBOT_TYPE) {
    return ['7', '8', '10', '11']
  }

  return []
}

export const getAllWellContentsAtFrame = (
  liquidState: RobotState['liquidState'],
  labwareDef: LabwareDefinition2
): WellContentsByLabware => {
  const labwareLiquidState = liquidState.labware
  const wellContentsByLabwareId = mapValues(
    labwareLiquidState,
    (labwareLiquids: SingleLabwareLiquidState, labwareId: string) => {
      return _wellContentsForLabware(labwareLiquids, labwareDef)
    }
  )
  return wellContentsByLabwareId
}

export const getLiquidDetailInfo = (
  wellContents: ContentsByWell,
  liquids: Liquid[]
): LiquidDetailInfo[] => {
  const individualIds = getLiquidIdsOnLabware(wellContents)
  const volumesPerLiquid = getVolumesPerLiquid(wellContents, individualIds)
  const liquidInfo: LiquidDetailInfo[] = individualIds.map(liquidId => {
    const totalVolume = sum(Object.values(volumesPerLiquid[liquidId]))
    const matchingLiquid = liquids.find(liquid => liquid.id === liquidId)

    return {
      totalVolume,
      //  TODO: add default liquid color
      color: matchingLiquid?.displayColor ?? COLORS.black70,
      displayName: matchingLiquid?.displayName ?? 'unknown display name',
    }
  })
  return liquidInfo
}

export const getMissingTips = (
  tipState: RobotState['tipState'],
  labwareId: string
): WellGroup | null => {
  const missingTipsByLabwareId =
    tipState &&
    mapValues(tipState.tipracks, tipMap =>
      reduce(
        tipMap,
        (acc, hasTip, wellName): WellGroup =>
          hasTip ? acc : { ...acc, [wellName]: null },
        {}
      )
    )
  const missingTips = missingTipsByLabwareId
    ? missingTipsByLabwareId[labwareId]
    : null

  return missingTips
}

interface ActiveLayer {
  isActiveLayerVisible: boolean
}

export const getActiveLayer = (
  id: string,
  selectedRunTimeCommand?: RunTimeCommand
): ActiveLayer => {
  const isStepAssosciatedWithLabwareId =
    selectedRunTimeCommand != null &&
    'labwareId' in selectedRunTimeCommand.params &&
    selectedRunTimeCommand.params.labwareId === id
  const isMoveStepAssosciatedWithLabwareId =
    selectedRunTimeCommand != null &&
    selectedRunTimeCommand.commandType === 'moveLabware' &&
    'labwareId' in selectedRunTimeCommand.params &&
    selectedRunTimeCommand.params.labwareId === id

  const isStepAssosciatedWithLabware =
    isStepAssosciatedWithLabwareId || isMoveStepAssosciatedWithLabwareId

  return {
    isActiveLayerVisible: isStepAssosciatedWithLabware,
  }
}

export const getTopmostLabwareOnModuleFromStack = (
  moduleId: string,
  labware: LabwareTemporalProperties[]
): string => {
  return labware
    .filter(lw => lw.stack.includes(moduleId)) // all stacks involving this module
    .sort((a, b) => b.stack.length - a.stack.length)[0]?.stack[0] // return topmost labware from largest stack
}

export const getChannels = (
  channels: number | null,
  nozzles?: NozzleConfigurationStyle
): number => {
  let numChannels = channels ?? 1
  if (nozzles === SINGLE) {
    numChannels = 1
  } else if (nozzles === COLUMN) {
    numChannels = 8
  } else if (nozzles === ROW) {
    numChannels = 12
  }
  return numChannels
}

export function getNextGroupFirstCommandId(
  groupedCommands: GroupedCommands | null,
  currentCommandId: string
): string | null {
  if (groupedCommands == null) {
    return null
  }

  const currentIndex = groupedCommands.findIndex(group => {
    if ('subCommands' in group) {
      return group.subCommands.some(
        leaf => leaf.command.id === currentCommandId
      )
    } else {
      return group.command.id === currentCommandId
    }
  })

  if (currentIndex === -1 || currentIndex + 1 >= groupedCommands.length) {
    return null // No next group
  }

  const nextGroup = groupedCommands[currentIndex + 1]

  if ('subCommands' in nextGroup) {
    return nextGroup.subCommands[0]?.command.id ?? null
  } else {
    return nextGroup.command.id
  }
}

export function getPreviousGroupFirstCommandId(
  groupedCommands: GroupedCommands | null,
  currentCommandId: string
): string | null {
  if (!groupedCommands) {
    return null
  }

  const currentIndex = groupedCommands.findIndex(group => {
    if ('subCommands' in group) {
      return group.subCommands.some(
        leaf => leaf.command.id === currentCommandId
      )
    } else {
      return group.command.id === currentCommandId
    }
  })

  if (currentIndex <= 0) {
    return null
  }

  const previousGroup = groupedCommands[currentIndex - 1]

  if ('subCommands' in previousGroup) {
    return previousGroup.subCommands[0]?.command.id ?? null
  } else {
    return previousGroup.command.id
  }
}

export const getThermocyclerOverlayText = (
  commandType: RunTimeCommand['commandType']
): string => {
  switch (commandType) {
    case 'loadModule':
      return 'Load Thermocycler'
    case 'thermocycler/openLid':
      return 'Opening lid'
    case 'thermocycler/closeLid':
      return 'Closing lid'
    case 'thermocycler/setTargetBlockTemperature':
      return 'Setting block temperature'
    case 'thermocycler/waitForLidTemperature':
      return 'Setting lid temperature'
    default:
      //  TODO: the rest of the copy isn't needed for protocol viz user testing purposes
      return 'Changing thermocycler state'
  }
}

export const getIsCutoutA1Active = (
  labware: RobotState['labware'],
  modules: RobotState['modules'],
  cutoutId: CutoutId,
  selectedRunTimeCommand?: RunTimeCommand
): boolean => {
  const labwareOnB1 = Object.entries(labware).find(
    ([_, lw]) => getSlotInLocationStack(lw.stack) === 'B1'
  )
  const hasThermocycler = Object.values(modules).some(
    module => module.moduleState.type === THERMOCYCLER_MODULE_TYPE
  )

  const { isActiveLayerVisible: isThermocyclerActive } =
    labwareOnB1 != null
      ? getActiveLayer(labwareOnB1[0], selectedRunTimeCommand)
      : { isActiveLayerVisible: false }

  return isThermocyclerActive && hasThermocycler && cutoutId === 'cutoutA1'
}

export const getModuleInnerProps = (
  moduleState: ModuleTemporalProperties['moduleState']
): ComponentProps<typeof Module>['innerProps'] => {
  if (moduleState.type === THERMOCYCLER_MODULE_TYPE) {
    let lidMotorState = 'unknown'
    if (moduleState.lidOpen) {
      lidMotorState = 'open'
    } else if (moduleState.lidOpen === false) {
      lidMotorState = 'closed'
    }
    return {
      lidMotorState,
      blockTargetTemp: moduleState.blockTargetTemp,
    }
  } else if (
    'targetTemperature' in moduleState &&
    moduleState.type === 'temperatureModuleType'
  ) {
    return {
      targetTemperature: moduleState.targetTemperature,
    }
  } else if ('targetTemp' in moduleState) {
    return {
      targetTemp: moduleState.targetTemp,
    }
  }
}

// TODO: the dropTipInPlace, airGapInplace, and
// blowoutInPlace commands don't have
// any knowledge of where its dropping. would be
// nice to expand the results key to include the
// addressable area name
export const getIsPipetteOverTrash = (
  pipettes: RobotState['pipettes'],
  id: string,
  selectedRunTimeCommand?: RunTimeCommand
): boolean =>
  Object.values(pipettes).some(pipette => pipette.entityId === id) &&
  selectedRunTimeCommand != null &&
  POTENTIAL_TRASH_COMMAND_TYPES.includes(selectedRunTimeCommand.commandType)
