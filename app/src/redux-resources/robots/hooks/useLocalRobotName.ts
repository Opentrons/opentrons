import { useSelector } from 'react-redux'

import { getLocalRobot } from '/app/redux/discovery'

export function useLocalRobotName(): string | null {
  const localRobot = useSelector(getLocalRobot)
  return localRobot?.name ?? null
}
