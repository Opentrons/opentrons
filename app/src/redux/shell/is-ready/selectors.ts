import { getIsOnDevice } from '../../config'
import type { State } from '../../types'

export function getIsShellReady(state: State): boolean {
  const isOnDevice = getIsOnDevice(state)
  const isDevMode = process.env.NODE_ENV === 'development'
  return isDevMode || !isOnDevice || state.shell.isReady
}
