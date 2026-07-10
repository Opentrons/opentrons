/** The Redux slice for audit log period deletion keys. */

import { createSlice } from '@reduxjs/toolkit'

import { type ActionTypesFromSlice } from '../ActionTypesFromSlice'

import type { PayloadAction } from '@reduxjs/toolkit'
import type { State } from '/app/redux/types'

export interface AuditState {
  /**
   * The server hands back a one-time deletion key when a log period is
   * downloaded; that key must be sent along with the delete request. Keyed
   * by logPeriodId. Intentionally not persisted: a stale tab shouldn't be
   * able to replay an old deletion key after a reload.
   */
  logPeriodDeletionKeysById: {
    [logPeriodId: string]: string | undefined
  }
}

export const INITIAL_AUDIT_STATE: AuditState = {
  logPeriodDeletionKeysById: {},
}

interface LogPeriodDeletionKeyReceivedPayload {
  logPeriodId: string
  deletionKey: string
}

interface LogPeriodDeletionKeyConsumedPayload {
  logPeriodId: string
}

const auditSlice = createSlice({
  name: 'audit',
  initialState: INITIAL_AUDIT_STATE,
  reducers: {
    logPeriodDeletionKeyReceived: (
      stateDraft,
      action: PayloadAction<LogPeriodDeletionKeyReceivedPayload>
    ) => {
      const { logPeriodId, deletionKey } = action.payload
      stateDraft.logPeriodDeletionKeysById[logPeriodId] = deletionKey
    },
    logPeriodDeletionKeyConsumed: (
      stateDraft,
      action: PayloadAction<LogPeriodDeletionKeyConsumedPayload>
    ) => {
      // dynamic-delete is fine here
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete stateDraft.logPeriodDeletionKeysById[action.payload.logPeriodId]
    },
  },
})

export const auditReducer = auditSlice.reducer

export const { logPeriodDeletionKeyReceived, logPeriodDeletionKeyConsumed } =
  auditSlice.actions

export type AuditAction = ActionTypesFromSlice<typeof auditSlice.actions>

export function getLogPeriodDeletionKeysById(
  state: State
): AuditState['logPeriodDeletionKeysById'] {
  return state.audit.logPeriodDeletionKeysById
}

export function getLogPeriodDeletionKey(
  state: State,
  logPeriodId: string
): string | null {
  return state.audit.logPeriodDeletionKeysById[logPeriodId] ?? null
}
