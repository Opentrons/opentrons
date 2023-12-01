import * as React from 'react'
import map from 'lodash/map'

import { parseInitialLoadedLabwareByAdapter } from '@opentrons/api-client'
import {
  BaseDeck,
  Flex,
  Box,
  DIRECTION_COLUMN,
  SPACING,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { getLabwareSetupItemGroups } from '../../../../pages/Protocols/utils'
import { getSimplestDeckConfigForProtocolCommands } from '../../../../resources/deck_configuration/utils'
import { getAttachedProtocolModuleMatches } from '../../../ProtocolSetupModulesAndDeck/utils'
import { useAttachedModules } from '../../hooks'
import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import { getLabwareRenderInfo } from '../utils/getLabwareRenderInfo'
import { getProtocolModulesInfo } from '../utils/getProtocolModulesInfo'
import { getStandardDeckViewLayerBlockList } from '../utils/getStandardDeckViewLayerBlockList'
import { OffDeckLabwareList } from './OffDeckLabwareList'

import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

const ATTACHED_MODULE_POLL_MS = 5000

interface SetupLabwareMapProps {
  runId: string
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
}

export function SetupLabwareMap({
  runId,
  protocolAnalysis,
}: SetupLabwareMapProps): JSX.Element | null {
  const attachedModules =
    useAttachedModules({
      refetchInterval: ATTACHED_MODULE_POLL_MS,
    }) ?? []

  // early return null if no protocol analysis
  if (protocolAnalysis == null) return null

  const commands = protocolAnalysis.commands

  const robotType = protocolAnalysis.robotType ?? FLEX_ROBOT_TYPE
  const deckDef = getDeckDefFromRobotType(robotType)

  const protocolModulesInfo = getProtocolModulesInfo(protocolAnalysis, deckDef)

  const attachedProtocolModuleMatches = getAttachedProtocolModuleMatches(
    attachedModules,
    protocolModulesInfo
  )

  const initialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter(
    commands
  )

  const moduleLocations = attachedProtocolModuleMatches.map(module => {
    const labwareInAdapterInMod =
      module.nestedLabwareId != null
        ? initialLoadedLabwareByAdapter[module.nestedLabwareId]
        : null
    //  only rendering the labware on top most layer so
    //  either the adapter or the labware are rendered but not both
    const topLabwareDefinition =
      labwareInAdapterInMod?.result?.definition ?? module.nestedLabwareDef
    const topLabwareId =
      labwareInAdapterInMod?.result?.labwareId ?? module.nestedLabwareId
    const topLabwareDisplayName =
      labwareInAdapterInMod?.params.displayName ??
      module.nestedLabwareDisplayName

    return {
      moduleModel: module.moduleDef.model,
      moduleLocation: { slotName: module.slotName },
      innerProps:
        module.moduleDef.model === THERMOCYCLER_MODULE_V1
          ? { lidMotorState: 'open' }
          : {},

      nestedLabwareDef: topLabwareDefinition,
      moduleChildren: (
        <>
          {topLabwareDefinition != null && topLabwareId != null ? (
            <LabwareInfoOverlay
              definition={topLabwareDefinition}
              labwareId={topLabwareId}
              displayName={topLabwareDisplayName}
              runId={runId}
            />
          ) : null}
        </>
      ),
    }
  })

  const { offDeckItems } = getLabwareSetupItemGroups(commands)

  const deckConfig = getSimplestDeckConfigForProtocolCommands(
    protocolAnalysis.commands
  )

  const labwareRenderInfo = getLabwareRenderInfo(protocolAnalysis, deckDef)

  const labwareLocations = map(
    labwareRenderInfo,
    ({ x, y, labwareDef, displayName, slotName }, labwareId) => {
      const labwareInAdapter = initialLoadedLabwareByAdapter[labwareId]
      //  only rendering the labware on top most layer so
      //  either the adapter or the labware are rendered but not both
      const topLabwareDefinition =
        labwareInAdapter?.result?.definition ?? labwareDef
      const topLabwareId = labwareInAdapter?.result?.labwareId ?? labwareId
      const topLabwareDisplayName =
        labwareInAdapter?.params.displayName ?? displayName

      return {
        labwareLocation: { slotName },
        definition: topLabwareDefinition,
        topLabwareId,
        topLabwareDisplayName,
        labwareChildren: (
          <LabwareInfoOverlay
            definition={topLabwareDefinition}
            labwareId={topLabwareId}
            displayName={topLabwareDisplayName}
            runId={runId}
          />
        ),
      }
    }
  )

  return (
    <Flex flex="1" maxHeight="180vh" flexDirection={DIRECTION_COLUMN}>
      <Flex flexDirection={DIRECTION_COLUMN} marginY={SPACING.spacing16}>
        <Box margin="0 auto" maxWidth="46.25rem" width="100%">
          <BaseDeck
            deckConfig={deckConfig}
            deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
            robotType={robotType}
            labwareLocations={labwareLocations}
            moduleLocations={moduleLocations}
          />
        </Box>
        <OffDeckLabwareList
          labwareItems={offDeckItems}
          isFlex={robotType === FLEX_ROBOT_TYPE}
          commands={commands}
        />
      </Flex>
    </Flex>
  )
}
