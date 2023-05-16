import * as React from 'react'
import { useSelector } from 'react-redux'
import { Redirect, useParams } from 'react-router-dom'

import {
  Box,
  Flex,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  OVERFLOW_SCROLL,
  SPACING,
  COLORS,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { useRobot, useSyncRobotClock } from '../../../organisms/Devices/hooks'
import { InstrumentsAndModules } from '../../../organisms/Devices/InstrumentsAndModules'
import { RecentProtocolRuns } from '../../../organisms/Devices/RecentProtocolRuns'
import { RobotOverview } from '../../../organisms/Devices/RobotOverview'
import { getScanning, OPENTRONS_USB } from '../../../redux/discovery'
import { appShellRequestor } from '../../../redux/shell/remote'

import type { DesktopRouteParams } from '../../../App/types'

export function DeviceDetails(): JSX.Element | null {
  const { robotName } = useParams<DesktopRouteParams>()
  const robot = useRobot(robotName)
  const isScanning = useSelector(getScanning)

  useSyncRobotClock(robotName)

  if (robot == null && isScanning) return null

  return robot != null ? (
    <ApiHostProvider
      key={robot.name}
      hostname={robot.ip ?? null}
      requestor={robot?.ip === OPENTRONS_USB ? appShellRequestor : undefined}
    >
      <Box
        minWidth="36rem"
        height="100%"
        overflow={OVERFLOW_SCROLL}
        paddingX={SPACING.spacing16}
        paddingTop={SPACING.spacing16}
        paddingBottom={SPACING.spacing48}
      >
        <Flex
          alignItems={ALIGN_CENTER}
          backgroundColor={COLORS.white}
          border={`1px solid ${String(COLORS.medGreyEnabled)}`}
          borderRadius="3px"
          flexDirection={DIRECTION_COLUMN}
          marginBottom={SPACING.spacing16}
          paddingX={SPACING.spacing16}
          paddingBottom={SPACING.spacing4}
          width="100%"
        >
          <RobotOverview robotName={robotName} />
          <InstrumentsAndModules robotName={robotName} />
        </Flex>
        <RecentProtocolRuns robotName={robotName} />
      </Box>
    </ApiHostProvider>
  ) : (
    <Redirect to="/devices" />
  )
}
