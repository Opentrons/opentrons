import { createSelector } from 'reselect'

import type { State } from '../types'
import type { StoredProtocolData } from './types'

export const getStoredProtocols: (
  state: State
) => StoredProtocolData[] = createSelector(
  state => state.protocolStorage.protocolKeys,
  state => state.protocolStorage.filesByProtocolKey,
  (protocolKeys, filesByProtocolKey) =>
    protocolKeys
      .map(protocolKey => filesByProtocolKey[protocolKey])
      .filter((file): file is StoredProtocolData => file != null)
)
