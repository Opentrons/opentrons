import * as React from 'react'
import { useParams } from 'react-router-dom'

import {
  Box,
  Flex,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  OVERFLOW_SCROLL,
  SIZE_6,
  SPACING,
  COLORS,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { useRobot, useSyncRobotClock } from '../../../organisms/Devices/hooks'
import { PipettesAndModules } from '../../../organisms/Devices/PipettesAndModules'
import { RecentProtocolRuns } from '../../../organisms/Devices/RecentProtocolRuns'
import { RobotOverview } from '../../../organisms/Devices/RobotOverview'

import type { NavRouteParams } from '../../../App/types'

export function DeviceDetails(): JSX.Element | null {
  const { robotName } = useParams<NavRouteParams>()
  const robot = useRobot(robotName)

  useSyncRobotClock(robotName)

  return robot != null ? (
    <ApiHostProvider key={robot.name} hostname={robot.ip ?? null}>
      <Box
        minWidth={SIZE_6}
        height="100%"
        overflow={OVERFLOW_SCROLL}
        paddingX={SPACING.spacing4}
        paddingTop={SPACING.spacing4}
        paddingBottom={SPACING.spacing7}
      >
        <Flex
          alignItems={ALIGN_CENTER}
          backgroundColor={COLORS.white}
          border={`1px solid ${COLORS.medGreyEnabled}`}
          borderRadius="3px"
          flexDirection={DIRECTION_COLUMN}
          marginBottom={SPACING.spacing4}
          paddingX={SPACING.spacing4}
          paddingBottom={SPACING.spacing2}
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
