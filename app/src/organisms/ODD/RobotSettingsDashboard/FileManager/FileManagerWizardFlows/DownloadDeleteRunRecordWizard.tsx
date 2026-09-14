import { useTranslation } from 'react-i18next'

import { useDeleteRunMutation } from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useDownloadRunRecord } from '/app/resources/devices/hooks/useDownloadRunRecord'

import { DownloadDeleteRecordFlow } from './shared/DownloadDeleteRecordFlow'

import type { ComponentProps, ReactNode } from 'react'
import type { RunData } from '@opentrons/api-client'

interface DownloadDeleteRunRecordWizardProps {
  run: RunData
  initialDeleteAfterDownload: boolean
  onClose: () => void
}

export function DownloadDeleteRunRecordWizard({
  run,
  initialDeleteAfterDownload,
  onClose,
}: DownloadDeleteRunRecordWizardProps): ReactNode {
  const { t } = useTranslation('device_details')

  const documentationState = useDocumentationState()
  const { downloadRunRecord } = useDownloadRunRecord(run)
  const { deleteRun } = useDeleteRunMutation(documentationState)

  const copyProps: ComponentProps<typeof DownloadDeleteRecordFlow>['copy'] = {
    title: t('download_run_record'),
    usbQuestion: t('which_usb_for_run_record'),
    choiceQuestion: t('delete_run_record_after_download'),
    downloadingText: t('downloading_run_record'),
    deletingText: t('deleting_run_record'),
    successMessage: t('run_record_downloaded'),
    downloadFailedText: t('run_record_download_failed'),
    deleteFailedText: t('run_record_delete_failed'),
  }

  return (
    <DownloadDeleteRecordFlow<void>
      copy={copyProps}
      showChoiceScreen={!initialDeleteAfterDownload}
      initialDeleteAfterDownload={initialDeleteAfterDownload}
      onDownload={downloadRunRecord}
      onDelete={() =>
        deleteRun({ runId: run.id }).then(() => 'deleted' as const)
      }
      onClose={onClose}
    />
  )
}
