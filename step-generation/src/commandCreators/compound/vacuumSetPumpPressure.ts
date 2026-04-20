import type { CommandCreator, VacuumPumpPressureArgs } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumSetPumpPressure: CommandCreator<VacuumPumpPressureArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [],
    python: '',
  }
}
