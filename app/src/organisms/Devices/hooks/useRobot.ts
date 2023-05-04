import { getDiscoverableRobotByName } from '../../../redux/discovery'
import type { DiscoveredRobot } from '../../../redux/discovery/types'
import type { State } from '../../../redux/types'
import { useSelector } from 'react-redux'

export function useRobot(robotName: string | null): DiscoveredRobot | null {
  const robot = useSelector((state: State) =>
    getDiscoverableRobotByName(state, robotName)
  )

  return robot
}
