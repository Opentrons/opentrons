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
                  }) => (
                    <Module
                      key={`LabwareSetup_Module_${String(
                        moduleDef.model
                      )}_${x}${y}`}
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
                      {nestedLabwareDef != null && nestedLabwareId != null ? (
                        <React.Fragment
                          key={`LabwareSetup_Labware_${String(
                            nestedLabwareDef.metadata.displayName
                          )}_${x}${y}`}
                        >
                          <LabwareRender definition={nestedLabwareDef} />
                          <LabwareInfoOverlay
                            definition={nestedLabwareDef}
                            labwareId={nestedLabwareId}
                            displayName={nestedLabwareDisplayName}
                            runId={runId}
                          />
                        </React.Fragment>
                      ) : null}
                    </Module>
                  )
                )}
                {map(
                  labwareRenderInfoById,
                  ({ x, y, labwareDef, displayName }, labwareId) => {
                    return (
                      <React.Fragment
                        key={`LabwareSetup_Labware_${String(
                          labwareDef.metadata.displayName
                        )}_${x}${y}`}
                      >
                        <g transform={`translate(${x},${y})`}>
                          <LabwareRender definition={labwareDef} />
                          <LabwareInfoOverlay
                            definition={labwareDef}
                            labwareId={labwareId}
                            displayName={displayName}
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
          isOt3={robotType === 'OT-3 Standard'}
        />
      </Flex>
    </Flex>
  )
}
