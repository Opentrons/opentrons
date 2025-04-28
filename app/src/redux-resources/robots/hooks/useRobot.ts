import { getDiscoverableRobotByName } from '/app/redux/discovery'
import type { DiscoveredRobot } from '/app/redux/discovery/types'
import type { State } from '/app/redux/types'
import { useSelector } from 'react-redux'

export function useRobot(robotName: string | null): DiscoveredRobot | null {
  const robot = useSelector((state: State) =>
    getDiscoverableRobotByName(state, robotName)
  )

  return robot
}
