import * as React from 'react'

import {
  Flex,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  SPACING_5,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { RobotCard } from './RobotCard'

import type { DiscoveredRobot } from '../../redux/discovery/types'

interface RobotSectionProps {
  robots: DiscoveredRobot[]
}

export function RobotSection({ robots }: RobotSectionProps): JSX.Element {
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      padding={`${SPACING_5} 0`}
    >
      {robots.map(robot => (
        <ApiHostProvider key={robot.name} hostname={robot.ip ?? null}>
          <RobotCard name={robot.name} local={robot.local} />
        </ApiHostProvider>
      ))}
    </Flex>
  )
}
