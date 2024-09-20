import { useRobot } from './useRobot'

import { CONNECTABLE } from '/app/redux/discovery'

export function useIsRobotViewable(robotName: string): boolean {
  const robot = useRobot(robotName)

  return robot?.status === CONNECTABLE
}
