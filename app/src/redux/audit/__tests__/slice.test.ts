import { describe, expect, it } from 'vitest'

import { DOWNLOAD_AUDIT_LOG } from '../constants'
import {
  auditReducer,
  getLogPeriodDeletionKey,
  getLogPeriodDownloadError,
  getLogPeriodDownloadStatus,
  INITIAL_AUDIT_STATE,
  logPeriodDeleteStarted,
  logPeriodDownloadCanceled,
  logPeriodDownloadFailed,
  logPeriodDownloadSucceeded,
} from '../slice'

import type { State } from '/app/redux/types'
import type { AuditState } from '../slice'

const makeState = (audit: AuditState): State => ({ audit }) as State

describe('audit download status', () => {
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

    expect(next.logPeriodDownloadStatusById['lp-1']).toEqual({
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

    expect(getLogPeriodDownloadStatus(makeState(next), 'lp-1')).toEqual({
      status: 'download-success',
      deletionKey: 'deletion-key-1',
    })
    expect(getLogPeriodDeletionKey(makeState(next), 'lp-1')).toEqual(
      'deletion-key-1'
    )
    expect(getLogPeriodDownloadError(makeState(next), 'lp-1')).toEqual(null)
  })

  it('marks a log period download as succeeded without a deletion key', () => {
    const next = auditReducer(
      INITIAL_AUDIT_STATE,
      logPeriodDownloadSucceeded({
        logPeriodId: 'lp-1',
        deletionKey: null,
      })
    )

    expect(getLogPeriodDownloadStatus(makeState(next), 'lp-1')).toEqual({
      status: 'download-success',
      deletionKey: null,
    })
    expect(getLogPeriodDeletionKey(makeState(next), 'lp-1')).toEqual(null)
  })

  it('marks a log period download as failed with an error', () => {
    const next = auditReducer(
      INITIAL_AUDIT_STATE,
      logPeriodDownloadFailed({
        logPeriodId: 'lp-1',
        error: 'network error',
      })
    )

    expect(getLogPeriodDownloadStatus(makeState(next), 'lp-1')).toEqual({
      status: 'download-failure',
      error: 'network error',
    })
    expect(getLogPeriodDeletionKey(makeState(next), 'lp-1')).toEqual(null)
    expect(getLogPeriodDownloadError(makeState(next), 'lp-1')).toEqual(
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
    expect(getLogPeriodDownloadStatus(makeState(next), 'lp-1')).toEqual({
      status: 'download-failure',
      error: 'download canceled by user',
    })
    expect(getLogPeriodDownloadError(makeState(next), 'lp-1')).toEqual(
      'download canceled by user'
    )
  })

  it('clears download status when delete starts', () => {
    const downloaded = auditReducer(
      INITIAL_AUDIT_STATE,
      logPeriodDownloadSucceeded({
        logPeriodId: 'lp-1',
        deletionKey: 'deletion-key-1',
      })
    )
    const next = auditReducer(
      downloaded,
      logPeriodDeleteStarted({ logPeriodId: 'lp-1' })
    )

    expect(getLogPeriodDownloadStatus(makeState(next), 'lp-1')).toEqual(null)
    expect(next.logPeriodDownloadStatusById).toEqual({})
  })

  it('returns null when no status exists for a log period', () => {
    expect(
      getLogPeriodDownloadStatus(makeState(INITIAL_AUDIT_STATE), 'lp-missing')
    ).toEqual(null)
  })
})
