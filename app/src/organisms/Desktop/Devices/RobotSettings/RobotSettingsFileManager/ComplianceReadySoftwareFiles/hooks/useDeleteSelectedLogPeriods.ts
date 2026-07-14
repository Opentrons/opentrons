import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { useDispatch, useSelector } from 'react-redux'

import { deleteLogPeriod } from '@opentrons/api-client'
import { ERROR_TOAST } from '@opentrons/components'
import { getQueryKey, useHost } from '@opentrons/react-api-client'

import { useToaster } from '/app/organisms/ToasterOven'
import {
  getLogPeriodDeletionKeysById,
  logPeriodDeletionKeyConsumed,
} from '/app/redux/audit'

import type { LogPeriodSummary } from '@opentrons/api-client'
import type { Dispatch } from '/app/redux/types'

interface UseDeleteSelectedLogPeriodsResult {
  deleteSelectedLogPeriods: (periods: LogPeriodSummary[]) => void
  deletingIds: Set<string>
}

export function useDeleteSelectedLogPeriods(): UseDeleteSelectedLogPeriodsResult {
  const { t } = useTranslation('device_details')
  const host = useHost()
  const dispatch = useDispatch<Dispatch>()
  const deletionKeysById = useSelector(getLogPeriodDeletionKeysById)
  const queryClient = useQueryClient()
  const { makeToast } = useToaster()
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const deleteSelectedLogPeriods = (periods: LogPeriodSummary[]): void => {
    if (host == null || periods.length === 0 || deletingIds.size > 0) {
      return
    }

    // The server requires the deletion key it handed back on download. If we
    // never downloaded (or downloaded in an earlier session), refuse to send
    // the request rather than let the server reject it as malformed.
    const deletablePeriods = periods.filter(period => {
      const hasKey = deletionKeysById[period.id] != null
      if (!hasKey) {
        makeToast(t('log_period_deletion_key_missing') as string, ERROR_TOAST, {
          closeButton: true,
        })
      }
      return hasKey
    })

    if (deletablePeriods.length === 0) {
      return
    }

    setDeletingIds(new Set(deletablePeriods.map(period => period.id)))

    Promise.all(
      deletablePeriods.map(period => {
        const deletionKey = deletionKeysById[period.id]
        return deleteLogPeriod(host, period.id, { deletionKey })
          .then(() => {
            dispatch(logPeriodDeletionKeyConsumed({ logPeriodId: period.id }))
          })
          .catch((e: Error) =>
            makeToast(e.message, ERROR_TOAST, { closeButton: true })
          )
      })
    )
      .then(() =>
        queryClient
          .invalidateQueries(getQueryKey(host, 'audit', 'logPeriods'))
          .catch((e: Error) => {
            console.error(`error invalidating logPeriods query: ${e.message}`)
          })
      )
      .then(() => {
        setDeletingIds(new Set())
      })
      .catch((e: Error) => {
        makeToast(e.message, ERROR_TOAST, { closeButton: true })
        setDeletingIds(new Set())
      })
  }

  return { deleteSelectedLogPeriods, deletingIds }
}
