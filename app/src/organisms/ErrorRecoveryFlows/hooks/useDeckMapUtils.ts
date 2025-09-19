import { useMemo } from 'react'

import { getLabwareLocation } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getDeckDefFromRobotType,
  getFixedTrashLabwareDefinition,
  getModuleDef,
  getModuleType,
  getPositionFromSlotId,
  getSimplestDeckConfigForProtocol,
  OT2_ROBOT_TYPE,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { RECOVERY_MAP } from '/app/organisms/ErrorRecoveryFlows/constants'
import { getRunModuleRenderInfo } from '/app/organisms/InterventionModal/utils'

import type { Run, RunData } from '@opentrons/api-client'
import type {
  CutoutConfigProtocolSpec,
  DeckDefinition,
  LabwareDefinition,
  LabwareDefinitionsByUri,
  LabwareLocation,
  LoadedLabware,
  LoadedModule,
  ModuleDefinition,
  ModuleModel,
  RobotType,
} from '@opentrons/shared-data'
import type { RunModuleInfo } from '/app/organisms/InterventionModal/utils'
import type { ErrorRecoveryFlowsProps } from '..'
import type { ERUtilsProps, ERUtilsResults } from './useERUtils'
import type { UseFailedLabwareUtilsResult } from './useFailedLabwareUtils'

interface UseDeckMapUtilsProps {
  runId: ErrorRecoveryFlowsProps['runId']
  protocolAnalysis: ErrorRecoveryFlowsProps['protocolAnalysis']
  failedLabwareUtils: UseFailedLabwareUtilsResult
  runLwDefsByUri: ERUtilsProps['runLwDefsByUri']
  runRecord: Run | undefined
  recoveryMap: ERUtilsResults['recoveryMap']
}

export interface UseDeckMapUtilsResult {
  deckConfig: CutoutConfigProtocolSpec[]
  modulesOnDeck: RunCurrentModulesOnDeck[]
  labwareOnDeck: RunCurrentLabwareOnDeck[]
  loadedLabware: LoadedLabware[]
  loadedModules: LoadedModule[]
  movedLabwareDef: LabwareDefinition | null
  moduleRenderInfo: RunModuleInfo[]
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
  runLwDefsByUri,
  recoveryMap,
}: UseDeckMapUtilsProps): UseDeckMapUtilsResult {
  const robotType = protocolAnalysis?.robotType ?? OT2_ROBOT_TYPE
  const deckConfig = getSimplestDeckConfigForProtocol(protocolAnalysis)
  const deckDef = getDeckDefFromRobotType(robotType)

  // TODO(jh, 11-05-24): Revisit this logic along with deckmap interfaces after deck map redesign.

  const currentModulesInfo = useMemo(
    () =>
      getRunCurrentModulesInfo({
        runRecord,
        deckDef,
        runLwDefsByUri,
      }),
    [runRecord, deckDef, runLwDefsByUri]
  )

  const runCurrentModules = useMemo(
    () =>
      getRunCurrentModulesOnDeck({
        failedLabwareUtils,
        runRecord,
        currentModulesInfo,
      }),
    [runId, protocolAnalysis, runRecord, deckDef, failedLabwareUtils]
  )

  const currentLabwareInfo = useMemo(
    () =>
      getRunCurrentLabwareInfo({ runData: runRecord?.data, runLwDefsByUri }),
    [runRecord, runLwDefsByUri]
  )

  const { updatedModules, remainingLabware } = useMemo(
    () => updateLabwareInModules({ runCurrentModules, currentLabwareInfo }),
    [runCurrentModules, currentLabwareInfo]
  )

  const runCurrentLabware = useMemo(
    () =>
      getRunCurrentLabwareOnDeck({
        failedLabwareUtils,
        runRecord,
        currentLabwareInfo: remainingLabware,
        recoveryMap,
      }),
    [failedLabwareUtils, currentLabwareInfo]
  )

  const movedLabwareDef =
    runLwDefsByUri != null && failedLabwareUtils.failedLabware != null
      ? runLwDefsByUri[failedLabwareUtils.failedLabware.definitionUri]
      : null

  const moduleRenderInfo = useMemo(
    () =>
      runRecord != null && runLwDefsByUri != null
        ? getRunModuleRenderInfo(runRecord.data, deckDef, runLwDefsByUri)
        : [],
    [deckDef, runLwDefsByUri, runRecord]
  )

  return {
    deckConfig,
    modulesOnDeck: updatedModules.map(
      ({
        moduleModel,
        moduleLocation,
        innerProps,
        nestedLabwareDefsBottomToTop,
      }) => ({
        moduleModel,
        moduleLocation,
        innerProps,
        nestedLabwareDefsBottomToTop,
      })
    ),
    labwareOnDeck: runCurrentLabware.map(
      ({ labwareLocation, definition, labwareId }) => ({
        labwareLocation,
        definition,
        labwareId,
      })
    ),
    highlightLabwareEventuallyIn: [...updatedModules, ...runCurrentLabware]
      .map(el => el.highlight)
      .filter(maybeSlot => maybeSlot != null) as string[],
    kind: 'intervention',
    robotType,
    loadedModules: runRecord?.data.modules ?? [],
    loadedLabware: runRecord?.data.labware ?? [],
    movedLabwareDef,
    moduleRenderInfo,
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
  nestedLabwareDefsBottomToTop: LabwareDefinition[]
}

// Builds the necessary module object expected by BaseDeck.
export function getRunCurrentModulesOnDeck({
  failedLabwareUtils,
  runRecord,
  currentModulesInfo,
}: {
  failedLabwareUtils: UseDeckMapUtilsProps['failedLabwareUtils']
  runRecord: UseDeckMapUtilsProps['runRecord']
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

      nestedLabwareDefsBottomToTop:
        nestedLabwareDef != null ? [nestedLabwareDef] : [],
      highlight: getIsLabwareMatch(
        nestedLabwareSlotName,
        runRecord,
        failedLabware
      )
        ? nestedLabwareSlotName
        : null,
    })
  )
}

interface RunCurrentLabwareOnDeck {
  labwareLocation: LabwareLocation
  definition: LabwareDefinition
  labwareId?: string
}
// Builds the necessary labware object expected by BaseDeck.
// Note that while this highlights all labware in the failed labware slot, the result is later filtered to render
// only the topmost labware.
export function getRunCurrentLabwareOnDeck({
  currentLabwareInfo,
  runRecord,
  failedLabwareUtils,
  recoveryMap,
}: {
  failedLabwareUtils: UseDeckMapUtilsProps['failedLabwareUtils']
  runRecord: UseDeckMapUtilsProps['runRecord']
  currentLabwareInfo: RunCurrentLabwareInfo[]
  recoveryMap: ERUtilsResults['recoveryMap']
}): Array<RunCurrentLabwareOnDeck & { highlight: string | null }> {
  const { route, step } = recoveryMap
  const { failedLabware, relevantPickUpTipLabware } = failedLabwareUtils

  const labwareToMatch = (): LoadedLabware | null => {
    if (
      route === RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE &&
      step === RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
    ) {
      return relevantPickUpTipLabware
    } else {
      return failedLabware
    }
  }

  return currentLabwareInfo.map(
    ({ slotName, labwareDef, labwareLocation, labwareId }) => ({
      labwareLocation,
      definition: labwareDef,
      highlight: getIsLabwareMatch(slotName, runRecord, labwareToMatch())
        ? slotName
        : null,
      labwareId,
    })
  )
}

interface RunCurrentModuleInfo {
  moduleId: string
  moduleDef: ModuleDefinition
  nestedLabwareDef: LabwareDefinition | null
  nestedLabwareSlotName: string
  slotName: string
}

// Derive the module info necessary to render modules and nested labware on the deck.
export const getRunCurrentModulesInfo = ({
  runRecord,
  deckDef,
  runLwDefsByUri,
}: {
  runRecord: UseDeckMapUtilsProps['runRecord']
  deckDef: DeckDefinition
  runLwDefsByUri: UseDeckMapUtilsProps['runLwDefsByUri']
}): RunCurrentModuleInfo[] => {
  if (runRecord == null) {
    return []
  } else {
    return runRecord.data.modules.reduce<RunCurrentModuleInfo[]>(
      (acc, module) => {
        const moduleDef = getModuleDef(module.model)
        const moduleType = getModuleType(moduleDef.model)

        // Get the labware that is placed on/in the module.
        // for stacker, we only want to consider labware in the hopper as "nested"
        const nestedLabware = runRecord.data.labware.find(
          lw =>
            typeof lw.location === 'object' &&
            'moduleId' in lw.location &&
            lw.location.moduleId === module.id &&
            (!(FLEX_STACKER_MODULE_TYPE === moduleType) ||
              (FLEX_STACKER_MODULE_TYPE === moduleType &&
                'kind' in lw.location &&
                lw.location.kind === 'inStackerHopper'))
        )

        const nestedLabwareDef =
          nestedLabware != null
            ? runLwDefsByUri[nestedLabware.definitionUri]
            : null

        const slotPosition = getPositionFromSlotId(
          module.location.slotName,
          deckDef
        )

        const nestedLwLoc = nestedLabware?.location ?? null
        const [nestedLwSlotName] = getSlotNameAndLwLocFrom(
          nestedLwLoc,
          runRecord.data,
          false
        )

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
  labwareDef: LabwareDefinition
  labwareLocation: LabwareLocation
  slotName: string
  labwareId?: string
}

// Derive the labware info necessary to render labware on the deck.
export function getRunCurrentLabwareInfo({
  runData,
  runLwDefsByUri,
}: {
  runData: RunData | undefined
  runLwDefsByUri: UseDeckMapUtilsProps['runLwDefsByUri']
}): RunCurrentLabwareInfo[] {
  if (runData == null) {
    return []
  } else {
    const allLabware = runData.labware.reduce(
      (acc: RunCurrentLabwareInfo[], lw) => {
        const loc = lw.location
        const [slotName, labwareLocation] = getSlotNameAndLwLocFrom(
          loc,
          runData,
          true
        ) // Exclude modules since handled separately.
        const labwareDef = getLabwareDefinition(lw, runLwDefsByUri)

        if (slotName == null || labwareLocation == null) {
          return acc
        } else {
          return [
            ...acc,
            {
              labwareDef,
              slotName,
              labwareLocation: labwareLocation,
              labwareId: lw.id,
            },
          ]
        }
      },
      []
    )

    // Group labware by slotName
    const labwareBySlot = allLabware.reduce<
      Record<string, RunCurrentLabwareInfo[]>
    >((acc, labware) => {
      const slot = labware.slotName
      if (!acc[slot]) {
        acc[slot] = []
      }
      acc[slot].push(labware)
      return acc
    }, {})

    // For each slot, return either:
    // 1. The first labware where no other labware has its 'labwareId' as a location
    // 2. The first labware in the slot if no labware matches criteria 1
    // TODO: (sarah, 8-22-25) revisit this logic and reduce complexity when we have location sequences
    return Object.values(labwareBySlot).map(slotLabware => {
      const topMostLabware = slotLabware.find(lw => {
        const labwareOnCurrentLabware = slotLabware.find(
          otherLw =>
            typeof otherLw.labwareLocation !== 'string' &&
            'labwareId' in otherLw.labwareLocation &&
            otherLw.labwareLocation.labwareId === lw.labwareId
        )
        return labwareOnCurrentLabware == null
      })

      return topMostLabware != null
        ? {
            ...topMostLabware,
            labwareLocation: { slotName: topMostLabware.slotName },
          }
        : slotLabware[0]
    })
  }
}

const getLabwareDefinition = (
  labware: LoadedLabware,
  protocolLabwareDefinitionsByUri: LabwareDefinitionsByUri
): LabwareDefinition => {
  if (labware.id === 'fixedTrash') {
    return getFixedTrashLabwareDefinition()
  } else {
    return protocolLabwareDefinitionsByUri[labware.definitionUri]
  }
}

// Get the slotName for on deck labware.
export function getSlotNameAndLwLocFrom(
  location: LabwareLocation | null,
  runData: RunData,
  excludeModules: boolean
): [string | null, LabwareLocation | null] {
  const labwareLocationObject = getLabwareLocation({
    location,
    detailLevel: 'slot-only',
    loadedLabwares: runData?.labware ?? [],
    loadedModules: runData?.modules ?? [],
    robotType: FLEX_ROBOT_TYPE,
  })
  const onModuleModel = labwareLocationObject?.moduleModel ?? null

  // change base slot to just be the column for hopper labware, leave shuttle
  // labware in the fourth row since we consolidate by slot name later
  const baseSlot =
    onModuleModel != null &&
    getModuleType(onModuleModel) === FLEX_STACKER_MODULE_TYPE
      ? labwareLocationObject?.slotName.charAt(0) ?? null
      : labwareLocationObject?.slotName ?? null
  if (
    location == null ||
    location === 'offDeck' ||
    location === 'systemLocation'
  ) {
    return [null, null]
  } else if (excludeModules && onModuleModel != null) {
    return [null, null]
  } else if ('moduleId' in location) {
    const moduleId = location.moduleId
    return [baseSlot, { moduleId }]
  } else if ('labwareId' in location) {
    const labwareId = location.labwareId
    return [baseSlot, { labwareId }]
  } else if ('addressableAreaName' in location) {
    const addressableAreaName = location.addressableAreaName
    return [baseSlot, { addressableAreaName }]
  } else if ('slotName' in location) {
    const slotName = location.slotName
    return [baseSlot, { slotName }]
  } else {
    return [null, null]
  }
}

// Whether the slotName labware is the same as the pickUpTipLabware.
export function getIsLabwareMatch(
  slotName: string,
  runRecord: UseDeckMapUtilsProps['runRecord'],
  pickUpTipLabware: LoadedLabware | null
): boolean {
  const location = pickUpTipLabware?.location ?? null

  const slotLocation =
    getLabwareLocation({
      location,
      detailLevel: 'slot-only',
      loadedLabwares: runRecord?.data?.labware ?? [],
      loadedModules: runRecord?.data?.modules ?? [],
      robotType: FLEX_ROBOT_TYPE,
    })?.slotName ?? null

  if (location == null) {
    return false
  }
  // This is the "off deck" case, which we do not render (and therefore return false).
  else if (typeof location === 'string') {
    return false
  } else {
    return slotLocation === slotName
  }
}

// If any labware share a slot with a module, the labware should be nested within the module for rendering purposes.
// This prevents issues such as TC nested labware rendering in "B1" instead of the special-cased location.
export function updateLabwareInModules({
  runCurrentModules,
  currentLabwareInfo,
}: {
  runCurrentModules: ReturnType<typeof getRunCurrentModulesOnDeck>
  currentLabwareInfo: ReturnType<typeof getRunCurrentLabwareInfo>
}): {
  updatedModules: ReturnType<typeof getRunCurrentModulesOnDeck>
  remainingLabware: ReturnType<typeof getRunCurrentLabwareInfo>
} {
  const usedSlots = new Set<string>()

  // a flex stackers module location will be in slot 3, but labware in that slot
  // is not nested on the stacker so we shouldn't match those up
  const updatedModules = runCurrentModules.map(moduleInfo => {
    const labwareInSameLoc = currentLabwareInfo.find(
      lw =>
        moduleInfo.moduleLocation.slotName === lw.slotName &&
        getModuleType(moduleInfo.moduleModel) !== FLEX_STACKER_MODULE_TYPE
    )

    if (labwareInSameLoc != null) {
      usedSlots.add(labwareInSameLoc.slotName)
      return {
        ...moduleInfo,
        nestedLabwareDef: labwareInSameLoc.labwareDef,
      }
    } else {
      return moduleInfo
    }
  })

  const remainingLabware = currentLabwareInfo.filter(
    lw => !usedSlots.has(lw.slotName)
  )

  return { updatedModules, remainingLabware }
}
