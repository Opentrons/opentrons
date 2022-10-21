import * as React from 'react'
import map from 'lodash/map'

import {
  Flex,
  Box,
  Module,
  RobotWorkSpace,
  DIRECTION_COLUMN,
  SPACING,
} from '@opentrons/components'
import { inferModuleOrientationFromXCoordinate } from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import { ModuleInfo } from '../../../ProtocolSetup/RunSetupCard/ModuleSetup/ModuleInfo'
import { useModuleRenderInfoForProtocolById } from '../../hooks'

const DECK_LAYER_BLOCKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]
const DECK_VIEW_BOX = '-80 -40 550 510'

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

  return (
    <Flex
      flex="1"
      maxHeight="180vh"
      marginTop={SPACING.spacing4}
      flexDirection={DIRECTION_COLUMN}
    >
      <Box margin="0 auto" maxWidth="46.25rem" width="100%">
        <RobotWorkSpace
          deckDef={standardDeckDef as any}
          viewBox={DECK_VIEW_BOX}
          deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
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
                      key={`ModuleSetup_Module_${model}_${x}${y}`}
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
            </>
          )}
        </RobotWorkSpace>
      </Box>
    </Flex>
  )
}
