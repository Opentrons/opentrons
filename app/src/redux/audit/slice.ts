/** The Redux slice for audit log period download and delete status. */

import { createSlice } from '@reduxjs/toolkit'

import { type ActionTypesFromSlice } from '../ActionTypesFromSlice'
import { DOWNLOAD_AUDIT_LOG, DOWNLOAD_AUDIT_LOGS } from './constants'

import type { PayloadAction } from '@reduxjs/toolkit'
import type { LogPeriodSummary } from '@opentrons/api-client'
import type { State } from '/app/redux/types'

export type LogPeriodDownloadDeleteStatus =
  | { status: 'download-pending' }
  | { status: 'download-success'; deletionKey: string }
  | { status: 'download-failure'; error: string }
  | { status: 'delete-pending' }
  | { status: 'delete-success' }
  | { status: 'delete-failure'; error: string }

export interface AuditState {
  /**
   * Download/delete lifecycle for a log period, keyed by logPeriodId.
   */
  logPeriodDownloadDeleteStatusById: {
    [logPeriodId: string]: LogPeriodDownloadDeleteStatus
  }
}

export const INITIAL_AUDIT_STATE: AuditState = {
  logPeriodDownloadDeleteStatusById: {},
}

interface LogPeriodIdPayload {
  logPeriodId: string
}

interface LogPeriodDownloadSucceededPayload {
  logPeriodId: string
  deletionKey: string
}

interface LogPeriodFailedPayload {
  logPeriodId: string
  error: string
}

const auditSlice = createSlice({
  name: 'audit',
  initialState: INITIAL_AUDIT_STATE,
  reducers: {
    logPeriodDownloadSucceeded: (
      stateDraft,
      action: PayloadAction<LogPeriodDownloadSucceededPayload>
    ) => {
      const { logPeriodId, deletionKey } = action.payload
      stateDraft.logPeriodDownloadDeleteStatusById[logPeriodId] = {
        status: 'download-success',
        deletionKey,
      }
    },
    logPeriodDownloadFailed: (
      stateDraft,
      action: PayloadAction<LogPeriodFailedPayload>
    ) => {
      const { logPeriodId, error } = action.payload
      stateDraft.logPeriodDownloadDeleteStatusById[logPeriodId] = {
        status: 'download-failure',
        error,
      }
    },
    logPeriodDownloadCanceled: (
      stateDraft,
      action: PayloadAction<LogPeriodIdPayload>
    ) => {
      const { logPeriodId } = action.payload
      stateDraft.logPeriodDownloadDeleteStatusById[logPeriodId] = {
        status: 'download-failure',
        error: 'download canceled by user',
      }
    },
    logPeriodDeletePending: (
      stateDraft,
      action: PayloadAction<LogPeriodIdPayload>
    ) => {
      stateDraft.logPeriodDownloadDeleteStatusById[action.payload.logPeriodId] =
        {
          status: 'delete-pending',
        }
    },
    logPeriodDeleteSucceeded: (
      stateDraft,
      action: PayloadAction<LogPeriodIdPayload>
    ) => {
      stateDraft.logPeriodDownloadDeleteStatusById[action.payload.logPeriodId] =
        {
          status: 'delete-success',
        }
    },
    logPeriodDeleteFailed: (
      stateDraft,
      action: PayloadAction<LogPeriodFailedPayload>
    ) => {
      const { logPeriodId, error } = action.payload
      stateDraft.logPeriodDownloadDeleteStatusById[logPeriodId] = {
        status: 'delete-failure',
        error,
      }
    },
  },
  extraReducers: builder => {
    builder.addMatcher(
      (
        action
      ): action is {
        type: typeof DOWNLOAD_AUDIT_LOG
        payload: { logPeriodId: string }
      } => action.type === DOWNLOAD_AUDIT_LOG,
      (stateDraft, action) => {
        stateDraft.logPeriodDownloadDeleteStatusById[
          action.payload.logPeriodId
        ] = {
          status: 'download-pending',
        }
      }
    )
    builder.addMatcher(
      (
        action
      ): action is {
        type: typeof DOWNLOAD_AUDIT_LOGS
        payload: { logPeriodSummaries: LogPeriodSummary[] }
      } => action.type === DOWNLOAD_AUDIT_LOGS,
      (stateDraft, action) => {
        action.payload.logPeriodSummaries.forEach(logPeriodSummary => {
          stateDraft.logPeriodDownloadDeleteStatusById[logPeriodSummary.id] = {
            status: 'download-pending',
          }
        })
      }
    )
  },
})

export const auditReducer = auditSlice.reducer

export const {
  logPeriodDownloadSucceeded,
  logPeriodDownloadFailed,
  logPeriodDownloadCanceled,
  logPeriodDeletePending,
  logPeriodDeleteSucceeded,
  logPeriodDeleteFailed,
} = auditSlice.actions

export type AuditSliceAction = ActionTypesFromSlice<typeof auditSlice.actions>

export function getLogPeriodDownloadDeleteStatusById(
  state: State
): AuditState['logPeriodDownloadDeleteStatusById'] {
  return state.audit.logPeriodDownloadDeleteStatusById
}

export function getLogPeriodDownloadDeleteStatus(
  state: State,
  logPeriodId: string
): LogPeriodDownloadDeleteStatus | null {
  return state.audit.logPeriodDownloadDeleteStatusById[logPeriodId] ?? null
}

/**
 * Returns the one-time deletion key from a successful download, if present.
 */
export function getLogPeriodDeletionKey(
  state: State,
  logPeriodId: string
): string | null {
  const status = getLogPeriodDownloadDeleteStatus(state, logPeriodId)
  return status?.status === 'download-success' ? status.deletionKey : null
}

export function getLogPeriodDownloadDeleteError(
  state: State,
  logPeriodId: string
): string | null {
  const status = getLogPeriodDownloadDeleteStatus(state, logPeriodId)
  return status?.status === 'download-failure' ||
    status?.status === 'delete-failure'
    ? status.error
    : null
}
