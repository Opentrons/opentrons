import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { getLocalRobot } from '/app/redux/discovery'
import { useDeleteSelectedRuns } from '/app/resources/devices/hooks/useDeleteSelectedRuns'
import { useDownloadSelectedRuns } from '/app/resources/devices/hooks/useDownloadSelectedRuns'
import { useNotifyAllRunsQuery } from '/app/resources/runs'

import { DownloadDeleteRecordFlow } from './shared/DownloadDeleteRecordFlow'

import type { ComponentProps, ReactNode } from 'react'
import type { RunData } from '@opentrons/api-client'

interface DeleteProtocolRunRecordsWizardProps {
  onClose: () => void
}

export function DeleteProtocolRunRecordsWizard({
  onClose,
}: DeleteProtocolRunRecordsWizardProps): ReactNode {
  const { t } = useTranslation('device_details')
  const robotName = useSelector(getLocalRobot)?.name ?? ''
  const { data: runData } = useNotifyAllRunsQuery()
  const allRuns = runData?.data ?? []

  const documentationState = useDocumentationState()
  const { mutateAsync: downloadRuns } = useDownloadSelectedRuns(robotName)
  const { deleteSelectedRuns } = useDeleteSelectedRuns(documentationState)

  const copyProps: ComponentProps<typeof DownloadDeleteRecordFlow>['copy'] = {
    title: t('delete_all_protocol_run_records'),
    usbQuestion: t('which_usb_for_protocol_files'),
    downloadingText: t('downloading_all_protocol_files'),
    deletingText: t('deleting_all_run_records'),
    successMessage: t('all_protocol_run_records_deleted'),
    downloadFailedText: t('run_records_download_failed'),
    deleteFailedText: t('run_records_delete_failed'),
  }

  return (
    <DownloadDeleteRecordFlow<readonly RunData[]>
      copy={copyProps}
      showChoiceScreen={false}
      initialDeleteAfterDownload
      onDownload={path =>
        downloadRuns({ runs: allRuns, callTimeUsbPath: path })
      }
      onDelete={downloadedRuns =>
        deleteSelectedRuns(downloadedRuns).then(() => 'deleted' as const)
      }
      onClose={onClose}
    />
  )
}
