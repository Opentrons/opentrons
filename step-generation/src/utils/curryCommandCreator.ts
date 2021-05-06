import type { CommandCreator, CurriedCommandCreator } from '../types'

/** Curry a command creator so its args are baked-in,
 * but it is still open to receiving different input states */
export function curryCommandCreator<Args>(
  commandCreator: CommandCreator<Args>,
  args: Args
): CurriedCommandCreator {
  return (_invariantContext, _prevRobotState) =>
    commandCreator(args, _invariantContext, _prevRobotState)
}
