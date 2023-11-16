import * as React from 'react'

import {
  BaseDeck,
  Box,
  Flex,
  DIRECTION_COLUMN,
  SPACING,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'

import { getSimplestDeckConfigForProtocolCommands } from '../../../../resources/deck_configuration/utils'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { getAttachedProtocolModuleMatches } from '../../../ProtocolSetupModulesAndDeck/utils'
import { ModuleInfo } from '../../ModuleInfo'
import { useAttachedModules, useStoredProtocolAnalysis } from '../../hooks'
import { getProtocolModulesInfo } from '../utils/getProtocolModulesInfo'
import { getStandardDeckViewLayerBlockList } from '../utils/getStandardDeckViewLayerBlockList'

const ATTACHED_MODULE_POLL_MS = 5000

interface SetupModulesMapProps {
  runId: string
}

export const SetupModulesMap = ({
  runId,
}: SetupModulesMapProps): JSX.Element | null => {
  // similar data pattern to ODD ProtocolSetupModules, with addition of stored analysis
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = robotProtocolAnalysis ?? storedProtocolAnalysis

  const attachedModules =
    useAttachedModules({
      refetchInterval: ATTACHED_MODULE_POLL_MS,
    }) ?? []

  // early return null if no protocol analysis
  if (protocolAnalysis == null) return null

  const robotType = protocolAnalysis.robotType ?? FLEX_ROBOT_TYPE
  const deckDef = getDeckDefFromRobotType(robotType)
  const protocolModulesInfo = getProtocolModulesInfo(protocolAnalysis, deckDef)

  const attachedProtocolModuleMatches = getAttachedProtocolModuleMatches(
    attachedModules,
    protocolModulesInfo
  )

  const moduleLocations = attachedProtocolModuleMatches.map(module => ({
    moduleModel: module.moduleDef.model,
    moduleLocation: { slotName: module.slotName },
    moduleChildren: (
      <ModuleInfo
        moduleModel={module.moduleDef.model}
        isAttached={module.attachedModuleMatch != null}
        physicalPort={module.attachedModuleMatch?.usbPort ?? null}
        runId={runId}
      />
    ),
  }))

  const deckConfig = getSimplestDeckConfigForProtocolCommands(
    protocolAnalysis.commands
  )

  return (
    <Flex
      flex="1"
      maxHeight="180vh"
      marginTop={SPACING.spacing16}
      flexDirection={DIRECTION_COLUMN}
    >
      <Box margin="0 auto" maxWidth="46.25rem" width="100%">
        <BaseDeck
          deckConfig={deckConfig.map(({ cutoutId, cutoutFixtureId }) => ({
            cutoutId,
            cutoutFixtureId,
          }))}
          deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
          robotType={robotType}
          labwareLocations={[]}
          moduleLocations={moduleLocations}
        />
      </Box>
    </Flex>
  )
}
