import { describe, expect, it } from 'vitest'

import { DOWNLOAD_AUDIT_LOG } from '../constants'
import {
  auditReducer,
  getLogPeriodDeletionKey,
  getLogPeriodDownloadDeleteError,
  getLogPeriodDownloadDeleteStatus,
  INITIAL_AUDIT_STATE,
  logPeriodDeleteFailed,
  logPeriodDeletePending,
  logPeriodDeleteSucceeded,
  logPeriodDownloadCanceled,
  logPeriodDownloadFailed,
  logPeriodDownloadSucceeded,
} from '../slice'

import type { State } from '/app/redux/types'
import type { AuditState } from '../slice'

const makeState = (audit: AuditState): State => ({ audit }) as State

describe('audit download/delete status', () => {
  it('marks a log period download as pending when download is requested', () => {
    const next = auditReducer(INITIAL_AUDIT_STATE, {
      type: DOWNLOAD_AUDIT_LOG,
      payload: {
        logPeriodId: 'lp-1',
        fileName: 'logperiod.zip',
        host: { hostname: '127.0.0.1' },
      },
      meta: { shell: true },
    })

    expect(next.logPeriodDownloadDeleteStatusById['lp-1']).toEqual({
      status: 'download-pending',
    })
  })

  it('marks a log period download as succeeded with a deletion key', () => {
    const next = auditReducer(
      INITIAL_AUDIT_STATE,
      logPeriodDownloadSucceeded({
        logPeriodId: 'lp-1',
        deletionKey: 'deletion-key-1',
      })
    )

    expect(getLogPeriodDownloadDeleteStatus(makeState(next), 'lp-1')).toEqual({
      status: 'download-success',
      deletionKey: 'deletion-key-1',
    })
    expect(getLogPeriodDeletionKey(makeState(next), 'lp-1')).toEqual(
      'deletion-key-1'
    )
    expect(getLogPeriodDownloadDeleteError(makeState(next), 'lp-1')).toEqual(
      null
    )
  })

  it('marks a log period download as failed with an error', () => {
    const next = auditReducer(
      INITIAL_AUDIT_STATE,
      logPeriodDownloadFailed({
        logPeriodId: 'lp-1',
        error: 'network error',
      })
    )

    expect(getLogPeriodDownloadDeleteStatus(makeState(next), 'lp-1')).toEqual({
      status: 'download-failure',
      error: 'network error',
    })
    expect(getLogPeriodDeletionKey(makeState(next), 'lp-1')).toEqual(null)
    expect(getLogPeriodDownloadDeleteError(makeState(next), 'lp-1')).toEqual(
      'network error'
    )
  })

  it('marks a log period download as failed when canceled', () => {
    const pending = auditReducer(INITIAL_AUDIT_STATE, {
      type: DOWNLOAD_AUDIT_LOG,
      payload: {
        logPeriodId: 'lp-1',
        fileName: 'logperiod.zip',
        host: { hostname: '127.0.0.1' },
      },
      meta: { shell: true },
    })
    const next = auditReducer(
      pending,
      logPeriodDownloadCanceled({ logPeriodId: 'lp-1' })
    )
    expect(getLogPeriodDownloadDeleteStatus(makeState(next), 'lp-1')).toEqual({
      status: 'download-failure',
      error: 'download canceled by user',
    })
    expect(getLogPeriodDownloadDeleteError(makeState(next), 'lp-1')).toEqual(
      'download canceled by user'
    )
  })

  it('tracks delete pending, success, and failure', () => {
    const pending = auditReducer(
      INITIAL_AUDIT_STATE,
      logPeriodDeletePending({ logPeriodId: 'lp-1' })
    )
    expect(
      getLogPeriodDownloadDeleteStatus(makeState(pending), 'lp-1')
    ).toEqual({
      status: 'delete-pending',
    })

    const succeeded = auditReducer(
      pending,
      logPeriodDeleteSucceeded({ logPeriodId: 'lp-1' })
    )
    expect(
      getLogPeriodDownloadDeleteStatus(makeState(succeeded), 'lp-1')
    ).toEqual({
      status: 'delete-success',
    })

    const failed = auditReducer(
      pending,
      logPeriodDeleteFailed({
        logPeriodId: 'lp-1',
        error: 'delete failed',
      })
    )
    expect(getLogPeriodDownloadDeleteStatus(makeState(failed), 'lp-1')).toEqual(
      {
        status: 'delete-failure',
        error: 'delete failed',
      }
    )
    expect(getLogPeriodDownloadDeleteError(makeState(failed), 'lp-1')).toEqual(
      'delete failed'
    )
  })

  it('returns null when no status exists for a log period', () => {
    expect(
      getLogPeriodDownloadDeleteStatus(
        makeState(INITIAL_AUDIT_STATE),
        'lp-missing'
      )
    ).toEqual(null)
  })
})
