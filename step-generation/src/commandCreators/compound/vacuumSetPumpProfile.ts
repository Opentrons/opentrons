import type { CommandCreator, VacuumProfileArgs } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumSetPumpProfile: CommandCreator<VacuumProfileArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [],
    python: '',
  }
}
