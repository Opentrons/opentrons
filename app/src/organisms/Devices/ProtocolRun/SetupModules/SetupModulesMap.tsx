import * as React from 'react'
import map from 'lodash/map'

import {
  Flex,
  Box,
  Module,
  RobotWorkSpace,
  SlotLabels,
  DIRECTION_COLUMN,
  SPACING,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'

import { ModuleInfo } from '../../ModuleInfo'
import {
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
} from '../../hooks'
import { getStandardDeckViewBox } from '../utils/getStandardDeckViewBox'
import { getStandardDeckViewLayerBlockList } from '../utils/getStandardDeckViewLayerBlockList'

interface SetupModulesMapProps {
  robotName: string
  runId: string
}

export const SetupModulesMap = ({
  robotName,
  runId,
}: SetupModulesMapProps): JSX.Element => {
  const moduleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )
  const { robotType } = useProtocolDetailsForRun(runId)

  const deckDef = getDeckDefFromRobotType(robotType)
  return (
    <Flex
      flex="1"
      maxHeight="180vh"
      marginTop={SPACING.spacing16}
      flexDirection={DIRECTION_COLUMN}
    >
      <Box margin="0 auto" maxWidth="46.25rem" width="100%">
        <RobotWorkSpace
          deckDef={deckDef}
          viewBox={getStandardDeckViewBox(robotType)}
          deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
          id="ModuleSetup_deckMap"
        >
          {() => (
            <>
              {map(
                moduleRenderInfoForProtocolById,
                ({ x, y, moduleDef, attachedModuleMatch }) => {
                  const { model } = moduleDef
                  return (
                    <React.Fragment
                      key={`ModuleSetup_Module_${String(model)}_${x}${y}`}
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
                          usbPort={attachedModuleMatch?.usbPort.port ?? null}
                          hubPort={attachedModuleMatch?.usbPort.hub ?? null}
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
      </Box>
    </Flex>
  )
}
