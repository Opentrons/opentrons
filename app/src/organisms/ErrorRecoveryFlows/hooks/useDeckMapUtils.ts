import { useMemo } from 'react'

import {
  getDeckDefFromRobotType,
  getFixedTrashLabwareDefinition,
  getModuleDef2,
  getPositionFromSlotId,
  getSimplestDeckConfigForProtocol,
  OT2_ROBOT_TYPE,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import {
  getRunLabwareRenderInfo,
  getRunModuleRenderInfo,
} from '/app/organisms/InterventionModal/utils'

import type { Run } from '@opentrons/api-client'
import type {
  DeckDefinition,
  ModuleDefinition,
  LabwareDefinition2,
  ModuleModel,
  LabwareLocation,
  CutoutConfigProtocolSpec,
  LoadedLabware,
  RobotType,
  LabwareDefinitionsByUri,
  LoadedModule,
} from '@opentrons/shared-data'
import type { ErrorRecoveryFlowsProps } from '..'
import type { UseFailedLabwareUtilsResult } from './useFailedLabwareUtils'
import type {
  RunLabwareInfo,
  RunModuleInfo,
} from '/app/organisms/InterventionModal/utils'
import type { ERUtilsProps } from './useERUtils'

interface UseDeckMapUtilsProps {
  runId: ErrorRecoveryFlowsProps['runId']
  protocolAnalysis: ErrorRecoveryFlowsProps['protocolAnalysis']
  failedLabwareUtils: UseFailedLabwareUtilsResult
  labwareDefinitionsByUri: ERUtilsProps['labwareDefinitionsByUri']
  runRecord?: Run
}

export interface UseDeckMapUtilsResult {
  deckConfig: CutoutConfigProtocolSpec[]
  modulesOnDeck: RunCurrentModulesOnDeck[]
  labwareOnDeck: RunCurrentLabwareOnDeck[]
  loadedLabware: LoadedLabware[]
  loadedModules: LoadedModule[]
  movedLabwareDef: LabwareDefinition2 | null
  moduleRenderInfo: RunModuleInfo[]
  labwareRenderInfo: RunLabwareInfo[]
  highlightLabwareEventuallyIn: string[]
  kind: 'intervention'
  robotType: RobotType
}
// Returns the utilities needed by the Recovery Deck Map.
export function useDeckMapUtils({
  protocolAnalysis,
  runRecord,
  runId,
  failedLabwareUtils,
  labwareDefinitionsByUri,
}: UseDeckMapUtilsProps): UseDeckMapUtilsResult {
  const robotType = protocolAnalysis?.robotType ?? OT2_ROBOT_TYPE
  const deckConfig = getSimplestDeckConfigForProtocol(protocolAnalysis)
  const deckDef = getDeckDefFromRobotType(robotType)

  const currentModulesInfo = useMemo(
    () =>
      getRunCurrentModulesInfo({
        runRecord,
        deckDef,
        labwareDefinitionsByUri,
      }),
    [runRecord, deckDef, labwareDefinitionsByUri]
  )

  const runCurrentModules = useMemo(
    () =>
      getRunCurrentModulesOnDeck({
        failedLabwareUtils,
        currentModulesInfo,
      }),
    [runId, protocolAnalysis, runRecord, deckDef, failedLabwareUtils]
  )

  const currentLabwareInfo = useMemo(
    () => getRunCurrentLabwareInfo({ runRecord, labwareDefinitionsByUri }),
    [runRecord, labwareDefinitionsByUri]
  )

  const runCurrentLabware = useMemo(
    () =>
      getRunCurrentLabwareOnDeck({
        failedLabwareUtils,
        currentLabwareInfo,
      }),
    [runId, protocolAnalysis, runRecord, deckDef, failedLabwareUtils]
  )

  const movedLabwareDef =
    labwareDefinitionsByUri != null && failedLabwareUtils.failedLabware != null
      ? labwareDefinitionsByUri[failedLabwareUtils.failedLabware.definitionUri]
      : null

  const moduleRenderInfo = useMemo(
    () =>
      runRecord != null && labwareDefinitionsByUri != null
        ? getRunModuleRenderInfo(
            runRecord.data,
            deckDef,
            labwareDefinitionsByUri
          )
        : [],
    [deckDef, labwareDefinitionsByUri, runRecord]
  )

  const labwareRenderInfo = useMemo(
    () =>
      runRecord != null && labwareDefinitionsByUri != null
        ? getRunLabwareRenderInfo(
            runRecord.data,
            labwareDefinitionsByUri,
            deckDef
          )
        : [],
    [deckDef, labwareDefinitionsByUri, runRecord]
  )

  return {
    deckConfig,
    modulesOnDeck: runCurrentModules.map(
      ({ moduleModel, moduleLocation, innerProps, nestedLabwareDef }) => ({
        moduleModel,
        moduleLocation,
        innerProps,
        nestedLabwareDef,
      })
    ),
    labwareOnDeck: runCurrentLabware.map(({ labwareLocation, definition }) => ({
      labwareLocation,
      definition,
    })),
    highlightLabwareEventuallyIn: [...runCurrentModules, ...runCurrentLabware]
      .map(el => el.highlight)
      .filter(maybeSlot => maybeSlot != null) as string[],
    kind: 'intervention',
    robotType,
    loadedModules: runRecord?.data.modules ?? [],
    loadedLabware: runRecord?.data.labware ?? [],
    movedLabwareDef,
    moduleRenderInfo,
    labwareRenderInfo,
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
}

// Builds the necessary module object expected by BaseDeck.
export function getRunCurrentModulesOnDeck({
  failedLabwareUtils,
  currentModulesInfo,
}: {
  failedLabwareUtils: UseDeckMapUtilsProps['failedLabwareUtils']
  currentModulesInfo: RunCurrentModuleInfo[]
}): Array<RunCurrentModulesOnDeck & { highlight: string | null }> {
  const { failedLabware } = failedLabwareUtils

  return currentModulesInfo.map(
    ({ moduleDef, slotName, nestedLabwareDef, nestedLabwareSlotName }) => ({
      moduleModel: moduleDef.model,
      moduleLocation: { slotName },
      innerProps:
        moduleDef.model === THERMOCYCLER_MODULE_V1
          ? { lidMotorState: 'open' }
          : {},

      nestedLabwareDef,
      highlight: getIsLabwareMatch(nestedLabwareSlotName, failedLabware)
        ? nestedLabwareSlotName
        : null,
    })
  )
}

interface RunCurrentLabwareOnDeck {
  labwareLocation: LabwareLocation
  definition: LabwareDefinition2
}
// Builds the necessary labware object expected by BaseDeck.
export function getRunCurrentLabwareOnDeck({
  currentLabwareInfo,
  failedLabwareUtils,
}: {
  failedLabwareUtils: UseDeckMapUtilsProps['failedLabwareUtils']
  currentLabwareInfo: RunCurrentLabwareInfo[]
}): Array<RunCurrentLabwareOnDeck & { highlight: string | null }> {
  const { failedLabware } = failedLabwareUtils

  return currentLabwareInfo.map(
    ({ slotName, labwareDef, labwareLocation }) => ({
      labwareLocation,
      definition: labwareDef,
      highlight: getIsLabwareMatch(slotName, failedLabware) ? slotName : null,
    })
  )
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
  labwareDefinitionsByUri,
}: {
  runRecord: UseDeckMapUtilsProps['runRecord']
  deckDef: DeckDefinition
  labwareDefinitionsByUri?: LabwareDefinitionsByUri | null
}): RunCurrentModuleInfo[] => {
  if (runRecord == null || labwareDefinitionsByUri == null) {
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
  labwareDefinitionsByUri,
}: {
  runRecord: UseDeckMapUtilsProps['runRecord']
  labwareDefinitionsByUri?: LabwareDefinitionsByUri | null
}): RunCurrentLabwareInfo[] {
  if (runRecord == null || labwareDefinitionsByUri == null) {
    return []
  } else {
    return runRecord.data.labware.reduce((acc: RunCurrentLabwareInfo[], lw) => {
      const loc = lw.location
      const [slotName, labwareLocation] = getSlotNameAndLwLocFrom(loc, true) // Exclude modules since handled separately.
      const labwareDef = getLabwareDefinition(lw, labwareDefinitionsByUri)

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

const getLabwareDefinition = (
  labware: LoadedLabware,
  protocolLabwareDefinitionsByUri: LabwareDefinitionsByUri
): LabwareDefinition2 => {
  if (labware.id === 'fixedTrash') {
    return getFixedTrashLabwareDefinition()
  } else {
    return protocolLabwareDefinitionsByUri[labware.definitionUri]
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
