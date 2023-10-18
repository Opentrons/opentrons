import * as React from 'react'
import map from 'lodash/map'

import {
  BaseDeck,
  Box,
  Flex,
  Module,
  RobotWorkSpace,
  SlotLabels,
  DIRECTION_COLUMN,
  SPACING,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getRobotTypeFromLoadedLabware,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'

import { getDeckConfigFromProtocolCommands } from '../../../../resources/deck_configuration/utils'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { getAttachedProtocolModuleMatches } from '../../../ProtocolSetupModules/utils'
import { ModuleInfo } from '../../ModuleInfo'
import {
  useAttachedModules,
  useModuleRenderInfoForProtocolById,
  useStoredProtocolAnalysis,
} from '../../hooks'
import { getProtocolModulesInfo } from '../utils/getProtocolModulesInfo'
import { getStandardDeckViewBox } from '../utils/getStandardDeckViewBox'
import { getStandardDeckViewLayerBlockList } from '../utils/getStandardDeckViewLayerBlockList'

const ATTACHED_MODULE_POLL_MS = 5000

interface SetupModulesMapProps {
  robotName: string
  runId: string
}

export const SetupModulesMap = ({
  robotName,
  runId,
}: SetupModulesMapProps): JSX.Element | null => {
  // TODO(bh, 2023-10-16): switch over to getProtocolModulesInfo/getAttachedProtocolModuleMatches for all deck map renders
  const moduleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )

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

  const robotType = getRobotTypeFromLoadedLabware(protocolAnalysis.labware)
  const deckDef = getDeckDefFromRobotType(robotType)
  const protocolModulesInfo = getProtocolModulesInfo(protocolAnalysis, deckDef)

  const attachedProtocolModuleMatches = getAttachedProtocolModuleMatches(
    attachedModules,
    protocolModulesInfo
  )

  const moduleLocations = attachedProtocolModuleMatches.map(module =>
    // TODO: innerProps?
    ({
      moduleModel: module.moduleDef.model,
      moduleLocation: { slotName: module.slotName },
      // no labware this page
      // nestedLabwareDef: module.nestedLabwareDef,
      moduleInformation: {
        isAttached: module.attachedModuleMatch != null,
        port: module.attachedModuleMatch?.usbPort.port,
      },
    })
  )

  const deckConfig = getDeckConfigFromProtocolCommands(
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
        {robotType === FLEX_ROBOT_TYPE ? (
          <BaseDeck
            deckConfig={deckConfig}
            robotType={robotType}
            labwareLocations={[]}
            moduleLocations={moduleLocations}
          />
        ) : (
          <RobotWorkSpace
            deckDef={deckDef}
            viewBox={getStandardDeckViewBox(robotType)}
            deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
            deckFill="#e6e6e6"
            trashSlotName="A3"
            id="ModuleSetup_deckMap"
          >
            {() => (
              <>
                {map(
                  moduleRenderInfoForProtocolById,
                  ({ x, y, moduleDef, attachedModuleMatch, moduleId }) => {
                    const { model } = moduleDef
                    return (
                      <React.Fragment
                        key={`ModuleSetup_Module_${moduleId}_${x}${y}`}
                      >
                        <Module
                          x={x}
                          y={y}
                          orientation={inferModuleOrientationFromXCoordinate(x)}
                          def={moduleDef}
                        >
                          <ModuleInfo
                            moduleModel={model}
                            isAttached={attachedModuleMatch != null}
                            physicalPort={attachedModuleMatch?.usbPort ?? null}
                            runId={runId}
                          />
                        </Module>
                      </React.Fragment>
                    )
                  }
                )}
                <SlotLabels robotType={robotType} />
              </>
            )}
          </RobotWorkSpace>
        )}
      </Box>
    </Flex>
  )
}
