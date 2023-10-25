import * as React from 'react'
import map from 'lodash/map'

import {
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
  inferModuleOrientationFromXCoordinate,
  RunTimeCommand,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import {
  useLabwareRenderInfoForRunById,
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
} from '../../hooks'
import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import { getStandardDeckViewLayerBlockList } from '../utils/getStandardDeckViewLayerBlockList'
import { getLabwareSetupItemGroups } from '../../../../pages/Protocols/utils'
import { OffDeckLabwareList } from './OffDeckLabwareList'
import { parseInitialLoadedLabwareByAdapter } from '@opentrons/api-client'

interface SetupLabwareMapProps {
  robotName: string
  runId: string
  commands: RunTimeCommand[]
}

export function SetupLabwareMap({
  robotName,
  runId,
  commands,
}: SetupLabwareMapProps): JSX.Element {
  const moduleRenderInfoById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )
  const { robotType } = useProtocolDetailsForRun(runId)
  const labwareRenderInfoById = useLabwareRenderInfoForRunById(runId)
  const deckDef = getDeckDefFromRobotType(robotType)
  const { offDeckItems } = getLabwareSetupItemGroups(commands)
  const initialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter(
    commands
  )
  return (
    <Flex flex="1" maxHeight="180vh" flexDirection={DIRECTION_COLUMN}>
      <Flex flexDirection={DIRECTION_COLUMN} marginY={SPACING.spacing16}>
        <Box margin="0 auto" maxWidth="46.25rem" width="100%">
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
                            <LabwareRender definition={topLabwareDefinition} />
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
