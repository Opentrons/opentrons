import * as React from 'react'

import {
  getDeckDefFromRobotType,
  getLoadedLabwareDefinitionsByUri,
  getModuleDef2,
  getPositionFromSlotId,
  getSimplestDeckConfigForProtocol,
  OT2_ROBOT_TYPE,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { LabwareHighlight } from '../shared/RecoveryMap'

import type { Run } from '@opentrons/api-client'
import type {
  DeckDefinition,
  ModuleDefinition,
  LabwareDefinition2,
  ModuleModel,
  LabwareLocation,
  CutoutConfigProtocolSpec,
  LoadedLabware,
} from '@opentrons/shared-data'
import type { ErrorRecoveryFlowsProps } from '..'
import type { UseFailedLabwareUtilsResult } from './useFailedLabwareUtils'

interface UseRecoveryMapUtilsProps {
  runId: ErrorRecoveryFlowsProps['runId']
  protocolAnalysis: ErrorRecoveryFlowsProps['protocolAnalysis']
  failedLabwareUtils: UseFailedLabwareUtilsResult
  runRecord?: Run
}

export interface UseRecoveryMapUtilsResult {
  deckConfig: CutoutConfigProtocolSpec[]
  runCurrentModules: RunCurrentModulesOnDeck[]
  runCurrentLabware: RunCurrentLabwareOnDeck[]
}
// Returns the utilities needed by the Recovery Deck Map.
export function useRecoveryMapUtils({
  protocolAnalysis,
  runRecord,
  runId,
  failedLabwareUtils,
}: UseRecoveryMapUtilsProps): UseRecoveryMapUtilsResult {
  const robotType = protocolAnalysis?.robotType ?? OT2_ROBOT_TYPE
  const deckConfig = getSimplestDeckConfigForProtocol(protocolAnalysis)
  const deckDef = getDeckDefFromRobotType(robotType)

  const currentModulesInfo = React.useMemo(
    () =>
      getRunCurrentModulesInfo({
        runRecord,
        deckDef,
        protocolAnalysis,
      }),
    [runRecord, deckDef, protocolAnalysis]
  )

  const runCurrentModules = React.useMemo(
    () =>
      getRunCurrentModulesOnDeck({
        failedLabwareUtils,
        currentModulesInfo,
      }),
    [runId, protocolAnalysis, runRecord, deckDef, failedLabwareUtils]
  )

  const currentLabwareInfo = React.useMemo(
    () => getRunCurrentLabwareInfo({ runRecord, protocolAnalysis }),
    [runRecord, protocolAnalysis]
  )

  const runCurrentLabware = React.useMemo(
    () =>
      getRunCurrentLabwareOnDeck({
        failedLabwareUtils,
        currentLabwareInfo,
      }),
    [runId, protocolAnalysis, runRecord, deckDef, failedLabwareUtils]
  )

  return {
    deckConfig,
    runCurrentModules,
    runCurrentLabware,
  }
}

interface RunCurrentModulesOnDeck {
  moduleModel: ModuleModel
  moduleLocation: {
    slotName: string
  }
  innerProps:
    | {
        lidMotorState: string
      }
    | {
        lidMotorState?: undefined
      }
  nestedLabwareDef: LabwareDefinition2 | null
  moduleChildren: JSX.Element | null
}

// Builds the necessary module object expected by BaseDeck.
export function getRunCurrentModulesOnDeck({
  failedLabwareUtils,
  currentModulesInfo,
}: {
  failedLabwareUtils: UseRecoveryMapUtilsProps['failedLabwareUtils']
  currentModulesInfo: RunCurrentModuleInfo[]
}): RunCurrentModulesOnDeck[] {
  const { pickUpTipLabware } = failedLabwareUtils

  return currentModulesInfo.map(
    ({ moduleDef, slotName, nestedLabwareDef, nestedLabwareSlotName }) => {
      const isLabwareMatch = getIsLabwareMatch(
        nestedLabwareSlotName,
        pickUpTipLabware
      )

      return {
        moduleModel: moduleDef.model,
        moduleLocation: { slotName },
        innerProps:
          moduleDef.model === THERMOCYCLER_MODULE_V1
            ? { lidMotorState: 'open' }
            : {},

        nestedLabwareDef,
        moduleChildren:
          isLabwareMatch && nestedLabwareDef != null ? (
            <LabwareHighlight highlight={true} definition={nestedLabwareDef} />
          ) : null,
      }
    }
  )
}

interface RunCurrentLabwareOnDeck {
  labwareLocation: LabwareLocation
  definition: LabwareDefinition2
  labwareChildren: JSX.Element | null
}
// Builds the necessary labware object expected by BaseDeck.
export function getRunCurrentLabwareOnDeck({
  currentLabwareInfo,
  failedLabwareUtils,
}: {
  failedLabwareUtils: UseRecoveryMapUtilsProps['failedLabwareUtils']
  currentLabwareInfo: RunCurrentLabwareInfo[]
}): RunCurrentLabwareOnDeck[] {
  const { pickUpTipLabware } = failedLabwareUtils

  return currentLabwareInfo.map(({ slotName, labwareDef, labwareLocation }) => {
    const isLabwareMatch = getIsLabwareMatch(slotName, pickUpTipLabware)

    return {
      labwareLocation,
      definition: labwareDef,
      labwareChildren: isLabwareMatch ? (
        <LabwareHighlight highlight={true} definition={labwareDef} />
      ) : null,
    }
  })
}

interface RunCurrentModuleInfo {
  moduleId: string
  moduleDef: ModuleDefinition
  nestedLabwareDef: LabwareDefinition2 | null
  nestedLabwareSlotName: string
  slotName: string
}

// Derive the module info necessary to render modules and nested labware on the deck.
export const getRunCurrentModulesInfo = ({
  runRecord,
  deckDef,
  protocolAnalysis,
}: {
  protocolAnalysis: UseRecoveryMapUtilsProps['protocolAnalysis']
  runRecord: UseRecoveryMapUtilsProps['runRecord']
  deckDef: DeckDefinition
}): RunCurrentModuleInfo[] => {
  if (runRecord == null || protocolAnalysis == null) {
    return []
  } else {
    return runRecord.data.modules.reduce<RunCurrentModuleInfo[]>(
      (acc, module) => {
        const moduleDef = getModuleDef2(module.model)

        // Get the labware that is placed on top of the module.
        const nestedLabware = runRecord.data.labware.find(
          lw =>
            typeof lw.location === 'object' &&
            'moduleId' in lw.location &&
            lw.location.moduleId === module.id
        )

        const labwareDefinitionsByUri = getLoadedLabwareDefinitionsByUri(
          protocolAnalysis.commands
        )

        const nestedLabwareDef =
          nestedLabware != null
            ? labwareDefinitionsByUri[nestedLabware.definitionUri]
            : null

        const slotPosition = getPositionFromSlotId(
          module.location.slotName,
          deckDef
        )

        const nestedLwLoc = nestedLabware?.location ?? null
        const [nestedLwSlotName] = getSlotNameAndLwLocFrom(nestedLwLoc, false)

        if (slotPosition == null) {
          return acc
        } else {
          return [
            ...acc,
            {
              moduleId: module.id,
              moduleDef,
              nestedLabwareDef,
              nestedLabwareSlotName: nestedLwSlotName ?? '',
              slotName: module.location.slotName,
            },
          ]
        }
      },
      []
    )
  }
}

interface RunCurrentLabwareInfo {
  labwareDef: LabwareDefinition2
  labwareLocation: LabwareLocation
  slotName: string
}

// Derive the labware info necessary to render labware on the deck.
export function getRunCurrentLabwareInfo({
  runRecord,
  protocolAnalysis,
}: {
  runRecord: UseRecoveryMapUtilsProps['runRecord']
  protocolAnalysis: UseRecoveryMapUtilsProps['protocolAnalysis']
}): RunCurrentLabwareInfo[] {
  if (runRecord == null || protocolAnalysis == null) {
    return []
  } else {
    return runRecord.data.labware.reduce((acc: RunCurrentLabwareInfo[], lw) => {
      const loc = lw.location
      const [slotName, labwareLocation] = getSlotNameAndLwLocFrom(loc, true) // Exclude modules since handled separately.
      const labwareDefinitionsByUri = getLoadedLabwareDefinitionsByUri(
        protocolAnalysis.commands
      )
      const labwareDef = labwareDefinitionsByUri[lw.definitionUri]

      if (slotName == null || labwareLocation == null) {
        return acc
      } else {
        return [
          ...acc,
          {
            labwareDef,
            slotName,
            labwareLocation: labwareLocation,
          },
        ]
      }
    }, [])
  }
}

// Get the slotName for on deck labware.
export function getSlotNameAndLwLocFrom(
  location: LabwareLocation | null,
  excludeModules: boolean
): [string | null, LabwareLocation | null] {
  if (location == null || location === 'offDeck') {
    return [null, null]
  } else if ('moduleId' in location) {
    if (excludeModules) {
      return [null, null]
    } else {
      const moduleId = location.moduleId
      return [moduleId, { moduleId }]
    }
  } else if ('labwareId' in location) {
    const labwareId = location.labwareId
    return [labwareId, { labwareId }]
  } else if ('addressableAreaName' in location) {
    const addressableAreaName = location.addressableAreaName
    return [addressableAreaName, { addressableAreaName }]
  } else if ('slotName' in location) {
    const slotName = location.slotName
    return [slotName, { slotName }]
  } else {
    return [null, null]
  }
}

// Whether the slotName labware is the same as the pickUpTipLabware.
export function getIsLabwareMatch(
  slotName: string,
  pickUpTipLabware: LoadedLabware | null
): boolean {
  const location = pickUpTipLabware?.location

  if (location == null) {
    return false
  }
  // This is the "off deck" case, which we do not render (and therefore return false).
  else if (typeof location === 'string') {
    return false
  } else if ('moduleId' in location) {
    return location.moduleId === slotName
  } else if ('slotName' in location) {
    return location.slotName === slotName
  } else if ('labwareId' in location) {
    return location.labwareId === slotName
  } else if ('addressableAreaName' in location) {
    return location.addressableAreaName === slotName
  } else return false
}
