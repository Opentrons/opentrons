import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { getLocalRobot } from '/app/redux/discovery'
import { useDeleteSelectedLogPeriods } from '/app/resources/devices/hooks/useDeleteSelectedLogPeriods'
import { useDownloadSelectedLogPeriods } from '/app/resources/devices/hooks/useDownloadSelectedLogPeriods'

import { DownloadDeleteRecordFlow } from './shared/DownloadDeleteRecordFlow'
import { getDeletableLogPeriods } from './shared/getDeletableLogPeriods'

import type { ComponentProps, ReactNode } from 'react'
import type { LogPeriodSummary } from '@opentrons/api-client'
import type { DownloadedLogPeriod } from '/app/resources/devices/hooks/useDownloadSelectedLogPeriods'

interface DownloadDeleteLogPeriodWizardProps {
  logPeriod: LogPeriodSummary
  initialDeleteAfterDownload: boolean
  onClose: () => void
}

export function DownloadDeleteLogPeriodWizard({
  logPeriod,
  initialDeleteAfterDownload,
  onClose,
}: DownloadDeleteLogPeriodWizardProps): ReactNode {
  const { t } = useTranslation('device_details')
  const robotName = useSelector(getLocalRobot)?.name ?? ''

  const documentationState = useDocumentationState()
  const downloadLogPeriodsMutation = useDownloadSelectedLogPeriods(robotName)
  const { deleteSelectedLogPeriods } =
    useDeleteSelectedLogPeriods(documentationState)

  const copyProps: ComponentProps<typeof DownloadDeleteRecordFlow>['copy'] = {
    title: t('download_log_period'),
    usbQuestion: t('which_usb_for_log_period'),
    choiceQuestion: t('delete_log_period_after_download'),
    downloadingText: t('downloading_log_period'),
    deletingText: t('deleting_log_period'),
    successMessage: t('log_period_downloaded'),
    downloadFailedText: t('log_period_download_failed'),
    deleteFailedText: t('log_period_delete_failed'),
    deletionKeyMissingText: t('log_period_deletion_key_missing'),
  }

  return (
    <DownloadDeleteRecordFlow<readonly DownloadedLogPeriod[]>
      copy={copyProps}
      showChoiceScreen={!initialDeleteAfterDownload}
      initialDeleteAfterDownload={initialDeleteAfterDownload}
      onDownload={path =>
        downloadLogPeriodsMutation.mutateAsync({
          logPeriods: [logPeriod],
          callTimeUsbPath: path,
        })
      }
      onDelete={downloadedPeriods => {
        const { logPeriods, deletionKeysByLogPeriodId } =
          getDeletableLogPeriods(downloadedPeriods)
        if (logPeriods.length === 0) {
          return Promise.resolve('deletion_key_missing' as const)
        }
        return deleteSelectedLogPeriods(
          logPeriods,
          deletionKeysByLogPeriodId
        ).then(() => 'deleted' as const)
      }}
      onClose={onClose}
    />
  )
}
