import { useSelector } from 'react-redux'
import {
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
} from '../../../redux/discovery'

import type {
  Robot,
  ReachableRobot,
  UnreachableRobot,
} from '../../../redux/discovery/types'
import type { State } from '../../../redux/types'

interface AvailableAndUnavailableDevices {
  availableDevices: Robot[]
  unavailableDevices: Array<UnreachableRobot | ReachableRobot>
}
export function useAvailableAndUnavailableDevices(): AvailableAndUnavailableDevices {
  const connectableRobots = useSelector((state: State) =>
    getConnectableRobots(state)
  )
  const reachableRobots = useSelector((state: State) =>
    getReachableRobots(state)
  )
  const unreachableRobots = useSelector((state: State) =>
    getUnreachableRobots(state)
  )

  const availableDevices = connectableRobots
  const unavailableDevices = [...reachableRobots, ...unreachableRobots]
  return { availableDevices, unavailableDevices }
}
