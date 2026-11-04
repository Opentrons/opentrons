import type { LogPeriodSummary } from '@opentrons/api-client'
import type { DownloadedLogPeriod } from '/app/resources/devices/hooks/useDownloadSelectedLogPeriods'

// the delete endpoint requires the one-time deletion key handed back by each
// period's download response; only periods that got one back can be deleted
export function getDeletableLogPeriods(
  downloadedPeriods: readonly DownloadedLogPeriod[]
): {
  logPeriods: LogPeriodSummary[]
  deletionKeysByLogPeriodId: Record<string, string>
} {
  const deletable = downloadedPeriods.filter(
    (downloaded): downloaded is DownloadedLogPeriod & { deletionKey: string } =>
      downloaded.deletionKey != null
  )

  const deletionKeysByLogPeriodId = deletable.reduce<Record<string, string>>(
    (acc, { logPeriod, deletionKey }) => {
      acc[logPeriod.id] = deletionKey
      return acc
    },
    {}
  )

  return {
    logPeriods: deletable.map(({ logPeriod }) => logPeriod),
    deletionKeysByLogPeriodId,
  }
}
