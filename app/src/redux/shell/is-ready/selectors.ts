import { getIsOnDevice } from '../../config'

import type { State } from '../../types'

export function getIsShellReady(state: State): boolean {
  const isOnDevice = getIsOnDevice(state)
  const isDevMode = _NODE_ENV_ === 'development'
  return isDevMode || !isOnDevice || state.shell.isReady
}
