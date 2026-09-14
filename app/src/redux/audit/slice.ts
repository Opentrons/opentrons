/** The Redux slice for audit log period download status. */

import { createSlice } from '@reduxjs/toolkit'
import omit from 'lodash/omit'

import { type ActionTypesFromSlice } from '../ActionTypesFromSlice'
import { DOWNLOAD_AUDIT_LOG, DOWNLOAD_AUDIT_LOGS } from './constants'

import type { PayloadAction } from '@reduxjs/toolkit'
import type { LogPeriodSummary } from '@opentrons/api-client'
import type { State } from '/app/redux/types'

export type LogPeriodDownloadStatus =
  | { status: 'download-pending' }
  | { status: 'download-success'; deletionKey: string }
  | { status: 'download-failure'; error: string }

export interface AuditState {
  /**
   * Download lifecycle for a log period, keyed by logPeriodId.
   */
  logPeriodDownloadStatusById: {
    [logPeriodId: string]: LogPeriodDownloadStatus
  }
}

export const INITIAL_AUDIT_STATE: AuditState = {
  logPeriodDownloadStatusById: {},
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
      stateDraft.logPeriodDownloadStatusById[logPeriodId] = {
        status: 'download-success',
        deletionKey,
      }
    },
    logPeriodDownloadFailed: (
      stateDraft,
      action: PayloadAction<LogPeriodFailedPayload>
    ) => {
      const { logPeriodId, error } = action.payload
      stateDraft.logPeriodDownloadStatusById[logPeriodId] = {
        status: 'download-failure',
        error,
      }
    },
    logPeriodDownloadCanceled: (
      stateDraft,
      action: PayloadAction<LogPeriodIdPayload>
    ) => {
      const { logPeriodId } = action.payload
      stateDraft.logPeriodDownloadStatusById[logPeriodId] = {
        status: 'download-failure',
        error: 'download canceled by user',
      }
    },
    logPeriodDeleteStarted: (
      stateDraft,
      action: PayloadAction<LogPeriodIdPayload>
    ) => {
      const { logPeriodId } = action.payload
      stateDraft.logPeriodDownloadStatusById = omit(
        stateDraft.logPeriodDownloadStatusById,
        logPeriodId
      )
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
        stateDraft.logPeriodDownloadStatusById[action.payload.logPeriodId] = {
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
          stateDraft.logPeriodDownloadStatusById[logPeriodSummary.id] = {
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
  logPeriodDeleteStarted,
} = auditSlice.actions

export type AuditSliceAction = ActionTypesFromSlice<typeof auditSlice.actions>

export function getLogPeriodDownloadStatusById(
  state: State
): AuditState['logPeriodDownloadStatusById'] {
  return state.audit.logPeriodDownloadStatusById
}

export function getLogPeriodDownloadStatus(
  state: State,
  logPeriodId: string
): LogPeriodDownloadStatus | null {
  return state.audit.logPeriodDownloadStatusById[logPeriodId] ?? null
}

/**
 * Returns the one-time deletion key from a successful download, if present.
 */
export function getLogPeriodDeletionKey(
  state: State,
  logPeriodId: string
): string | null {
  const status = getLogPeriodDownloadStatus(state, logPeriodId)
  return status?.status === 'download-success' ? status.deletionKey : null
}

export function getLogPeriodDownloadError(
  state: State,
  logPeriodId: string
): string | null {
  const status = getLogPeriodDownloadStatus(state, logPeriodId)
  return status?.status === 'download-failure' ? status.error : null
}
