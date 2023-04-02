import { useSelector } from 'react-redux'

import { getDiscoverableRobotByName } from '../../../redux/discovery'

import type { DiscoveredRobot } from '../../../redux/discovery/types'
import type { State } from '../../../redux/types'

/**
 * A custom hook that returns the DiscoveredRobot object for the specified robot name.
 *
 * @param {string | null} robotName - The name of the robot to get.
 * @returns {DiscoveredRobot | null} The DiscoveredRobot object for the specified robot name, or null if not found.
 */

export function useRobot(robotName: string | null): DiscoveredRobot | null {
  const robot = useSelector((state: State) =>
    getDiscoverableRobotByName(state, robotName)
  )

  return robot
}
