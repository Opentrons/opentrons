import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDistance } from 'date-fns'

import type { TFunction } from 'i18next'

const UPDATE_TIME_INTERVAL_MS = 60000

// Given the last run timestamp, update the time since the last run on an interval.
export function useUpdatedLastRunTime(lastRun: string | undefined): string {
  const { t } = useTranslation(['protocol_info'])

  const [updatedLastRun, setUpdatedLastRun] = useState(() =>
    computeLastRunFromNow(lastRun, t as TFunction)
  )
  useEffect(() => {
    const timer = setInterval(() => {
      setUpdatedLastRun(computeLastRunFromNow(lastRun, t as TFunction))
    }, UPDATE_TIME_INTERVAL_MS)

    return () => {
      clearInterval(timer)
    }
  }, [lastRun, t])

  return updatedLastRun
}

function computeLastRunFromNow(
  lastRun: string | undefined,
  t: TFunction
): string {
  return lastRun != null
    ? formatDistance(new Date(lastRun), new Date(), {
        addSuffix: true,
      }).replace('about ', '')
    : t('no_history')
}
