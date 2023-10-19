import * as React from 'react'
import map from 'lodash/map'

import { parseInitialLoadedLabwareByAdapter } from '@opentrons/api-client'
import {
  BaseDeck,
  Flex,
  Box,
  LabwareRender,
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
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { getLabwareSetupItemGroups } from '../../../../pages/Protocols/utils'
import { getDeckConfigFromProtocolCommands } from '../../../../resources/deck_configuration/utils'
import { getAttachedProtocolModuleMatches } from '../../../ProtocolSetupModules/utils'
import {
  useAttachedModules,
  useLabwareRenderInfoForRunById,
  useModuleRenderInfoForProtocolById,
} from '../../hooks'
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
  robotName: string
  runId: string
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
}

export function SetupLabwareMap({
  robotName,
  runId,
  protocolAnalysis,
}: SetupLabwareMapProps): JSX.Element | null {
  // TODO(bh, 2023-10-16): remove these hooks for all deck map renders
  const moduleRenderInfoById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )
  const labwareRenderInfoById = useLabwareRenderInfoForRunById(runId)

  const attachedModules =
    useAttachedModules({
      refetchInterval: ATTACHED_MODULE_POLL_MS,
    }) ?? []

  // early return null if no protocol analysis
  if (protocolAnalysis == null) return null

  const commands = protocolAnalysis.commands

  const robotType = getRobotTypeFromLoadedLabware(protocolAnalysis.labware)
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
      nestedLabwareDef: topLabwareDefinition,
      labwareInformation: {
        labwareId: topLabwareId,
        displayName: topLabwareDisplayName,
        // TODO: offsets
      },
      moduleInformation: {
        isAttached: module.attachedModuleMatch != null,
        port: module.attachedModuleMatch?.usbPort.port,
      },
    }
  })

  const { offDeckItems } = getLabwareSetupItemGroups(commands)

  const deckConfig = getDeckConfigFromProtocolCommands(
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

      // TODO: get offset vector for each labware
      //   const offsetVector = useLabwareOffsetForLabware(runId, labwareId)?.vector
      return {
        labwareLocation: { slotName },
        definition: topLabwareDefinition,
        topLabwareId,
        topLabwareDisplayName,
      }
    }
  )

  return (
    <Flex flex="1" maxHeight="180vh" flexDirection={DIRECTION_COLUMN}>
      <Flex flexDirection={DIRECTION_COLUMN} marginY={SPACING.spacing16}>
        <Box margin="0 auto" maxWidth="46.25rem" width="100%">
          {robotType === FLEX_ROBOT_TYPE ? (
            <BaseDeck
              deckConfig={deckConfig}
              robotType={robotType}
              labwareLocations={labwareLocations}
              moduleLocations={moduleLocations}
            />
          ) : (
            <RobotWorkSpace
              deckDef={deckDef}
              deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
              deckFill="#e6e6e6"
              trashSlotName="A3"
              id="LabwareSetup_deckMap"
            >
              {() => (
                <>
                  {map(
                    moduleRenderInfoById,
                    ({
                      x,
                      y,
                      moduleDef,
                      nestedLabwareDef,
                      nestedLabwareId,
                      nestedLabwareDisplayName,
                      moduleId,
                    }) => {
                      const labwareInAdapterInMod =
                        nestedLabwareId != null
                          ? initialLoadedLabwareByAdapter[nestedLabwareId]
                          : null
                      //  only rendering the labware on top most layer so
                      //  either the adapter or the labware are rendered but not both
                      const topLabwareDefinition =
                        labwareInAdapterInMod?.result?.definition ??
                        nestedLabwareDef
                      const topLabwareId =
                        labwareInAdapterInMod?.result?.labwareId ??
                        nestedLabwareId
                      const topLabwareDisplayName =
                        labwareInAdapterInMod?.params.displayName ??
                        nestedLabwareDisplayName

                      return (
                        <Module
                          key={`LabwareSetup_Module_${moduleId}_${x}${y}`}
                          x={x}
                          y={y}
                          orientation={inferModuleOrientationFromXCoordinate(x)}
                          def={moduleDef}
                          innerProps={
                            moduleDef.model === THERMOCYCLER_MODULE_V1
                              ? { lidMotorState: 'open' }
                              : {}
                          }
                        >
                          {topLabwareDefinition != null &&
                          topLabwareId != null ? (
                            <React.Fragment
                              key={`LabwareSetup_Labware_${topLabwareId}_${x}${y}`}
                            >
                              <LabwareRender
                                definition={topLabwareDefinition}
                              />
                              <LabwareInfoOverlay
                                definition={topLabwareDefinition}
                                labwareId={topLabwareId}
                                displayName={topLabwareDisplayName}
                                runId={runId}
                              />
                            </React.Fragment>
                          ) : null}
                        </Module>
                      )
                    }
                  )}
                  {map(
                    labwareRenderInfoById,
                    ({ x, y, labwareDef, displayName }, labwareId) => {
                      const labwareInAdapter =
                        initialLoadedLabwareByAdapter[labwareId]
                      //  only rendering the labware on top most layer so
                      //  either the adapter or the labware are rendered but not both
                      const topLabwareDefinition =
                        labwareInAdapter?.result?.definition ?? labwareDef
                      const topLabwareId =
                        labwareInAdapter?.result?.labwareId ?? labwareId
                      const topLabwareDisplayName =
                        labwareInAdapter?.params.displayName ?? displayName

                      return (
                        <React.Fragment
                          key={`LabwareSetup_Labware_${topLabwareId}_${x}${y}`}
                        >
                          <g transform={`translate(${x},${y})`}>
                            <LabwareRender definition={topLabwareDefinition} />
                            <LabwareInfoOverlay
                              definition={topLabwareDefinition}
                              labwareId={topLabwareId}
                              displayName={topLabwareDisplayName}
                              runId={runId}
                            />
                          </g>
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
        <OffDeckLabwareList
          labwareItems={offDeckItems}
          isFlex={robotType === FLEX_ROBOT_TYPE}
          commands={commands}
        />
      </Flex>
    </Flex>
  )
}
