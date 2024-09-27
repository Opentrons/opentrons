import { useRobot } from '/app/redux-resources/robots'

import { CONNECTABLE } from '/app/redux/discovery'

export function useIsRobotViewable(robotName: string): boolean {
  const robot = useRobot(robotName)

  return robot?.status === CONNECTABLE
}
