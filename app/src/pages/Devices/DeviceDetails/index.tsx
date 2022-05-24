import * as React from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import {
  Box,
  Flex,
  ALIGN_CENTER,
  C_MED_LIGHT_GRAY,
  C_WHITE,
  DIRECTION_COLUMN,
  OVERFLOW_SCROLL,
  SIZE_6,
  SPACING_3,
  useInterval,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { useRobot } from '../../../organisms/Devices/hooks'
import { PipettesAndModules } from '../../../organisms/Devices/PipettesAndModules'
import { RecentProtocolRuns } from '../../../organisms/Devices/RecentProtocolRuns'
import { RobotOverview } from '../../../organisms/Devices/RobotOverview'
import { fetchModules } from '../../../redux/modules'
import { fetchPipettes } from '../../../redux/pipettes'

import type { NavRouteParams } from '../../../App/types'
import type { Dispatch } from '../../../redux/types'

export function DeviceDetails(): JSX.Element | null {
  const { robotName } = useParams<NavRouteParams>()

  const robot = useRobot(robotName)
  const dispatch = useDispatch<Dispatch>()

  // TODO(BC, 2022-05-23): replace this with an interval query once pipettes and modules have been added to the react-api-client
  useInterval(
    () => {
      if (robotName != null) {
        dispatch(fetchModules(robotName))
        dispatch(fetchPipettes(robotName))
      }
    },
    5000,
    true
  )

  return robot != null ? (
    <ApiHostProvider key={robot.name} hostname={robot.ip ?? null}>
      <Box
        minWidth={SIZE_6}
        height="100%"
        overflow={OVERFLOW_SCROLL}
        padding={SPACING_3}
      >
        <Flex
          alignItems={ALIGN_CENTER}
          backgroundColor={C_WHITE}
          border={`1px solid ${C_MED_LIGHT_GRAY}`}
          borderRadius="3px"
          flexDirection={DIRECTION_COLUMN}
          marginBottom={SPACING_3}
          padding={SPACING_3}
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
