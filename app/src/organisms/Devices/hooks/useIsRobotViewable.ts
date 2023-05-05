import { CONNECTABLE } from '../../../redux/discovery'
import { useRobot } from './useRobot'

export function useIsRobotViewable(robotName: string): boolean {
  const robot = useRobot(robotName)

  return robot?.status === CONNECTABLE
}
