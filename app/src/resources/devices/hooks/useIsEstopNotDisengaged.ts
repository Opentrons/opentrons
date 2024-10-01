import { useEstopQuery } from '@opentrons/react-api-client'
import { useIsFlex } from '/app/redux-resources/robots'

/**
 * Checks if the emergency stop is not disengaged.
 *
 * @param {string} robotName - The name of the robot.
 * @returns {boolean} Returns true if the emergency stop is not disengaged, false otherwise.
 * not disengaged cases are physically engaged, logically engaged, and not present(unplugged)
 * For OT-2, the return is always false
 *
 * @example
 * const isNotDisengaged = useIsEstopNotDisengaged('Robot1');
 */

export const useIsEstopNotDisengaged = (robotName: string): boolean => {
  const isFlex = useIsFlex(robotName)
  const { data: estopStatus, error: estopError } = useEstopQuery({
    enabled: isFlex,
  })

  return isFlex
    ? estopStatus?.data.status !== 'disengaged' || estopError !== null
    : false
}
