import { useSelector } from 'react-redux'

import { getDiscoverableRobotByName } from '../../../redux/discovery'

import type { DiscoveredRobot } from '../../../redux/discovery/types'
import type { State } from '../../../redux/types'

export function useRobot(robotName: string): DiscoveredRobot | null {
  const robot = useSelector((state: State) =>
    getDiscoverableRobotByName(state, robotName)
  )

  return robot
}
