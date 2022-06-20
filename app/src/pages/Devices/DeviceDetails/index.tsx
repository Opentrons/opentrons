import * as React from 'react'
import { useParams } from 'react-router-dom'

import {
  Box,
  Flex,
  ALIGN_CENTER,
  C_WHITE,
  DIRECTION_COLUMN,
  OVERFLOW_SCROLL,
  SIZE_6,
  SPACING_3,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { useRobot } from '../../../organisms/Devices/hooks'
import { PipettesAndModules } from '../../../organisms/Devices/PipettesAndModules'
import { RecentProtocolRuns } from '../../../organisms/Devices/RecentProtocolRuns'
import { RobotOverview } from '../../../organisms/Devices/RobotOverview'

import type { NavRouteParams } from '../../../App/types'

export function DeviceDetails(): JSX.Element | null {
  const { robotName } = useParams<NavRouteParams>()

  const robot = useRobot(robotName)

  return robot != null ? (
    <ApiHostProvider key={robot.name} hostname={robot.ip ?? null}>
      <Box
        minWidth={SIZE_6}
        height="100%"
        overflow={OVERFLOW_SCROLL}
        padding={SPACING_3}
      >
        {/* TODO(va, 2022-06-17) update border color to 
            COLORS.medGreyEnabled when PR #10664 is merged */}
        <Flex
          alignItems={ALIGN_CENTER}
          backgroundColor={C_WHITE}
          border={`1px solid #e3e3e3`}
          borderRadius="3px"
          flexDirection={DIRECTION_COLUMN}
          marginBottom={SPACING_3}
          paddingX={SPACING_3}
          paddingBottom={SPACING_3}
          width="100%"
        >
          <RobotOverview robotName={robotName} />
          <PipettesAndModules robotName={robotName} />
        </Flex>
        <RecentProtocolRuns robotName={robotName} />
      </Box>
    </ApiHostProvider>
  ) : null
}
