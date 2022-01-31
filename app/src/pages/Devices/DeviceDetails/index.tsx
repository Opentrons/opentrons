import * as React from 'react'
import { useParams } from 'react-router-dom'

import {
  Box,
  Flex,
  C_MED_LIGHT_GRAY,
  C_WHITE,
  DIRECTION_COLUMN,
  OVERFLOW_SCROLL,
  SIZE_6,
  SPACING_2,
  SPACING_3,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { useAttachedModules, useRobot } from '../../../organisms/Devices/hooks'
import { RobotOverview } from '../../../organisms/Devices/RobotOverview'
import { ModuleCard } from '../../../organisms/Devices/ModuleCard'

import type { NextGenRouteParams } from '../../../App/NextGenApp'

export function DeviceDetails(): JSX.Element | null {
  const { robotName } = useParams<NextGenRouteParams>()

  const robot = useRobot(robotName)

  const attachedModules = useAttachedModules(robotName)
  console.log('attachedModules', attachedModules)

  return robot != null ? (
    <ApiHostProvider key={robot.name} hostname={robot.ip ?? null}>
      <Box
        minWidth={SIZE_6}
        height="100%"
        overflow={OVERFLOW_SCROLL}
        padding={SPACING_3}
      >
        <Flex
          backgroundColor={C_WHITE}
          border={`1px solid ${C_MED_LIGHT_GRAY}`}
          borderRadius="4px"
          flexDirection={DIRECTION_COLUMN}
          marginBottom={SPACING_2}
          padding={SPACING_3}
          width="100%"
        >
          <RobotOverview robotName={robotName} />

          {attachedModules.map(module => {
            console.log(module)
            return <ModuleCard />
          })}
        </Flex>
      </Box>
    </ApiHostProvider>
  ) : null
}
