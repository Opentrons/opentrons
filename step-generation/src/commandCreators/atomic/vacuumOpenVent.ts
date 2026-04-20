import type { CommandCreator, VacuumOpenVentArgs } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumOpenVent: CommandCreator<VacuumOpenVentArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [],
    python: '',
  }
}
