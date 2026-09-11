import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { useLogPeriodSummariesQuery } from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { getLocalRobot } from '/app/redux/discovery'
import { useDeleteSelectedLogPeriods } from '/app/resources/devices/hooks/useDeleteSelectedLogPeriods'
import { useDownloadSelectedLogPeriods } from '/app/resources/devices/hooks/useDownloadSelectedLogPeriods'

import { DownloadDeleteRecordFlow } from './shared/DownloadDeleteRecordFlow'
import { getDeletableLogPeriods } from './shared/getDeletableLogPeriods'

import type { ComponentProps, ReactNode } from 'react'
import type { DownloadedLogPeriod } from '/app/resources/devices/hooks/useDownloadSelectedLogPeriods'

interface DeleteLogPeriodsWizardProps {
  onClose: () => void
}

export function DeleteLogPeriodsWizard({
  onClose,
}: DeleteLogPeriodsWizardProps): ReactNode {
  const { t } = useTranslation('device_details')
  const robotName = useSelector(getLocalRobot)?.name ?? ''
  const { data: logPeriodData } = useLogPeriodSummariesQuery()
  const allLogPeriods = logPeriodData?.data ?? []

  const documentationState = useDocumentationState()
  const downloadLogPeriodsMutation = useDownloadSelectedLogPeriods(robotName)
  const { deleteSelectedLogPeriods } =
    useDeleteSelectedLogPeriods(documentationState)

  const copyProps: ComponentProps<typeof DownloadDeleteRecordFlow>['copy'] = {
    title: t('delete_all_log_periods_title'),
    usbQuestion: t('which_usb_for_log_periods'),
    downloadingText: t('downloading_all_log_periods'),
    deletingText: t('deleting_all_log_periods'),
    successMessage: t('all_log_periods_deleted'),
    downloadFailedText: t('log_periods_download_failed'),
    deleteFailedText: t('log_periods_delete_failed'),
    deletionKeyMissingText: t('log_period_deletion_key_missing'),
  }

  return (
    <DownloadDeleteRecordFlow<readonly DownloadedLogPeriod[]>
      copy={copyProps}
      showChoiceScreen={false}
      initialDeleteAfterDownload
      onDownload={path =>
        downloadLogPeriodsMutation.mutateAsync({
          logPeriods: allLogPeriods,
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
