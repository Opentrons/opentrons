import * as React from 'react'

import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getLoadedLabwareDefinitionsByUri,
  getModuleDef2,
  getPositionFromSlotId,
  getSimplestDeckConfigForProtocol,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { LabwareInfoOverlay } from '../../Devices/ProtocolRun/LabwareInfoOverlay'
import { LabwareHighlight } from '../shared/RecoveryMap'

import type { Run } from '@opentrons/api-client'
import type {
  DeckDefinition,
  ModuleDefinition,
  LabwareDefinition2,
  ModuleModel,
  LabwareLocation,
  AddressableAreaName,
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

export interface GetRecoveryMapUtilsResult {
  deckConfig: CutoutConfigProtocolSpec[]
  runCurrentModules: RunCurrentModulesOnDeck[]
  runCurrentLabware: RunCurrentLabwareOnDeck[]
}

// TOME: If you don't actually need this to be a hook, make a utils folder and move getErrorKind in there!

export function getRecoveryMapUtils({
  protocolAnalysis,
  runRecord,
  runId,
  failedLabwareUtils,
}: UseRecoveryMapUtilsProps): GetRecoveryMapUtilsResult {
  const robotType = protocolAnalysis?.robotType ?? FLEX_ROBOT_TYPE
  const deckConfig = getSimplestDeckConfigForProtocol(protocolAnalysis)
  const deckDef = getDeckDefFromRobotType(robotType)
  const runCurrentModules = getRunCurrentModulesOnDeck({
    runId,
    protocolAnalysis,
    runRecord,
    deckDef,
  })
  const runCurrentLabware = getRunCurrentLabwareOnDeck({
    runId,
    protocolAnalysis,
    runRecord,
    deckDef,
    failedLabwareUtils,
  })

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
  moduleChildren: JSX.Element
}

// TOME: You'll have to add hover in a bit!
function getRunCurrentModulesOnDeck(params: {
  runId: UseRecoveryMapUtilsProps['runId']
  protocolAnalysis: UseRecoveryMapUtilsProps['protocolAnalysis']
  runRecord: UseRecoveryMapUtilsProps['runRecord']
  deckDef: DeckDefinition
}): RunCurrentModulesOnDeck[] {
  const currentModulesInfo = getRunCurrentModulesInfo(params)

  return currentModulesInfo.map(
    ({ moduleDef, slotName, nestedLabwareDef, nestedLabwareId }) => {
      return {
        moduleModel: moduleDef.model,
        moduleLocation: { slotName },
        innerProps:
          moduleDef.model === THERMOCYCLER_MODULE_V1
            ? { lidMotorState: 'open' }
            : {},

        nestedLabwareDef: nestedLabwareDef,
        moduleChildren: (
          <>
            {nestedLabwareDef != null && nestedLabwareId != null ? (
              <LabwareInfoOverlay
                definition={nestedLabwareDef}
                labwareId={nestedLabwareId}
                displayName={null}
                runId={params.runId}
                hover={true}
              />
            ) : null}
          </>
        ),
      }
    }
  )
}

interface RunCurrentLabwareOnDeck {
  labwareLocation: LabwareLocation
  definition: LabwareDefinition2
  labwareChildren: JSX.Element | null
}

// TOME: Only use the overlay if you have genuine labware!!
function getRunCurrentLabwareOnDeck(params: {
  runId: UseRecoveryMapUtilsProps['runId']
  deckDef: DeckDefinition
  runRecord: UseRecoveryMapUtilsProps['runRecord']
  protocolAnalysis: UseRecoveryMapUtilsProps['protocolAnalysis']
  failedLabwareUtils: UseRecoveryMapUtilsProps['failedLabwareUtils']
}): RunCurrentLabwareOnDeck[] {
  const currentLabwareInfo = getRunCurrentLabwareInfo(params)

  const { pickUpTipLabware } = params.failedLabwareUtils

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
  nestedLabwareId: string | null
  slotName: string
}

// Derive the module info necessary to render modules and nested labware on the deck.
const getRunCurrentModulesInfo = ({
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

        const nestedLabwareId =
          typeof nestedLabware?.location === 'object' &&
          'labwareId' in nestedLabware.location
            ? nestedLabware.location.labwareId
            : null

        if (slotPosition == null) {
          return acc
        } else {
          return [
            ...acc,
            {
              moduleId: module.id,
              moduleDef,
              nestedLabwareDef,
              nestedLabwareId: nestedLabwareId,
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
function getRunCurrentLabwareInfo({
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
      const location = lw.location

      const labwareDefinitionsByUri = getLoadedLabwareDefinitionsByUri(
        protocolAnalysis.commands
      )
      const labwareDef = labwareDefinitionsByUri[lw.definitionUri]

      if (location === 'offDeck' || 'moduleId' in location) {
        return acc
      } else if ('labwareId' in location) {
        const labwareId = location.labwareId
        return [
          ...acc,
          {
            labwareDef,
            labwareLocation: { labwareId },
            slotName: labwareId,
          },
        ]
      } else {
        const isAddressableArea = 'addressableAreaName' in location
        const slotName = isAddressableArea
          ? location.addressableAreaName
          : location.slotName

        return [
          ...acc,
          {
            labwareDef,
            slotName,
            labwareLocation: isAddressableArea
              ? { addressableAreaName: slotName as AddressableAreaName }
              : { slotName },
          },
        ]
      }
    }, [])
  }
}

// Whether the slotName labware is the same as the pickUpTipLabware.
function getIsLabwareMatch(
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
  }
  // Should never reasonably be true for pickUpTipLabware.
  else if ('moduleId' in location) {
    return false
  } else if ('slotName' in location) {
    return location.slotName === slotName
  } else if ('labwareId' in location) {
    return location.labwareId === slotName
  } else if ('addressableAreaName' in location) {
    return location.addressableAreaName === slotName
  } else return false
}
