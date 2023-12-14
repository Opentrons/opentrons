import type { State } from '../../types'

// this is currnetly only wired up to the app-shell-odd, so it will only work on the ODD
export const getIsMassStorageDeviceConnected = (state: State): boolean => {
  const isMassStorageDeviceConnected =
    state.shell.connectedMassStorage.rootPaths.size > 0
  return isMassStorageDeviceConnected
}
