import type { RunTimeCommand } from '@opentrons/shared-data'

export const getIsVisibleProtocolStep = (command: RunTimeCommand): boolean => {
  return !command.commandType.includes('load') && command.commandType !== 'home'
}
