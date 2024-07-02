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

interface CodeInfo {
  analysis: string | null
  code: string | null
  error: string | null
}
export const getCodeAnalysis: (state: State) => CodeInfo = createSelector(
  state => state.protocolStorage.analysis,
  state => state.protocolStorage.code,
  state => state.protocolStorage.codeError,
  (analysis, code, error) => {
    return { analysis, code, error }
  }
)

export const getStoredProtocol: (
  state: State,
  protocolKey?: string
) => StoredProtocolData | null = (state, protocolKey) =>
  protocolKey != null
    ? state.protocolStorage.filesByProtocolKey[protocolKey] ?? null
    : null

export const getIsProtocolAnalysisInProgress: (
  state: State,
  protocolKey: string
) => boolean = (state, protocolKey) =>
  state.protocolStorage.inProgressAnalysisProtocolKeys.includes(protocolKey)
