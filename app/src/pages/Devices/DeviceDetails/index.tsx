import * as React from 'react'
import { useParams } from 'react-router-dom'

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
  WRAP,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { useAttachedModules, useRobot } from '../../../organisms/Devices/hooks'
import { PipettesAndModules } from '../../../organisms/Devices/PipettesAndModules'
import { RecentProtocolRuns } from '../../../organisms/Devices/RecentProtocolRuns'
import { RobotOverview } from '../../../organisms/Devices/RobotOverview'
import { ModuleCard } from '../../../organisms/Devices/ModuleCard'

import type { NextGenRouteParams } from '../../../App/NextGenApp'

export function DeviceDetails(): JSX.Element | null {
  const { robotName } = useParams<NextGenRouteParams>()

  const robot = useRobot(robotName)

  const attachedModules = useAttachedModules(robotName)

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
          <Flex flexWrap={WRAP} alignItems={ALIGN_CENTER} width="100%">
            {attachedModules.map((module, index) => {
              return (
                <Flex key={`moduleCard_${module.type}_${index}`}>
                  <ModuleCard module={module} />
                </Flex>
              )
            })}
          </Flex>
        </Flex>
        <RecentProtocolRuns robotName={robotName} />
      </Box>
    </ApiHostProvider>
  ) : null
}
