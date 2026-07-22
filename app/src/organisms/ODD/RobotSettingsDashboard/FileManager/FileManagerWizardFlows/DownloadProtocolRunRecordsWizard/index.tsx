import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { WizardHeader } from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { getLocalRobot } from '/app/redux/discovery'
import { useDeleteSelectedRuns } from '/app/resources/devices/hooks/useDeleteSelectedRuns'
import { useDownloadSelectedRuns } from '/app/resources/devices/hooks/useDownloadSelectedRuns'
import { useNotifyAllRunsQuery } from '/app/resources/runs'

import { ErrorScreen } from '../shared/ErrorScreen'
import styles from '../shared/shared.module.css'
import { SimpleChoiceScreen } from '../shared/SimpleChoiceScreen'
import { SpinnerScreen } from '../shared/SpinnerScreen'
import { SuccessScreen } from '../shared/SuccessScreen'
import { UsbSelectionScreen } from '../shared/UsbSelectionScreen'
import { STEP_TYPES } from './types'

import type { StepType } from './types'

interface DownloadProtocolRunRecordsWizardProps {
  onClose: () => void
}

export function DownloadProtocolRunRecordsWizard({
  onClose,
}: DownloadProtocolRunRecordsWizardProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const robotName = useSelector(getLocalRobot)?.name ?? ''
  const { data: runData } = useNotifyAllRunsQuery()
  const allRuns = runData?.data ?? []

  const [step, setStep] = useState<StepType>(STEP_TYPES.USB)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [deleteAfterDownload, setDeleteAfterDownload] = useState<boolean>(true)
  const [errorSubText, setErrorSubText] = useState('')

  const documentationState = useDocumentationState()
  const { downloadRuns } = useDownloadSelectedRuns(
    robotName,
    selectedPath ?? undefined
  )
  const { deleteSelectedRuns } = useDeleteSelectedRuns(documentationState)

  const isActiveStep =
    step === STEP_TYPES.DOWNLOADING || step === STEP_TYPES.DELETING
  const currentStepNumber =
    step === STEP_TYPES.USB ? 1 : step === STEP_TYPES.CONFIRM_DELETE ? 2 : null

  const deleteChoices = [
    { value: true, label: t('yes_delete_records') },
    { value: false, label: t('keep_records') },
  ]

  const handleContinueFromUsb = (path: string): void => {
    setSelectedPath(path)
    setStep(STEP_TYPES.CONFIRM_DELETE)
  }

  const handleContinueFromConfirmDelete = (): void => {
    setStep(STEP_TYPES.DOWNLOADING)
    downloadRuns(allRuns)
      .then(() => {
        if (!deleteAfterDownload) {
          setStep(STEP_TYPES.SUCCESS)
          return
        }
        setStep(STEP_TYPES.DELETING)
        deleteSelectedRuns(
          allRuns,
          () => {
            setStep(STEP_TYPES.SUCCESS)
          },
          () => {
            setErrorSubText(t('run_records_delete_failed') as string)
            setStep(STEP_TYPES.ERROR)
          }
        )
      })
      .catch(() => {
        setErrorSubText(t('run_records_download_failed') as string)
        setStep(STEP_TYPES.ERROR)
      })
  }

  return createPortal(
    <div className={styles.overlay} aria-modal="true" role="dialog">
      <div className={styles.modal}>
        <WizardHeader
          title={t('download_all_protocol_run_records')}
          onExit={onClose}
          totalSteps={step === STEP_TYPES.SUCCESS ? 1 : isActiveStep ? null : 2}
          currentStep={
            step === STEP_TYPES.SUCCESS
              ? 1
              : isActiveStep
                ? null
                : currentStepNumber
          }
          hideStepText={step === STEP_TYPES.SUCCESS}
        />
        <div className={styles.body}>
          {step === STEP_TYPES.USB ? (
            <UsbSelectionScreen
              question={t('which_usb_for_protocol_files')}
              onContinue={handleContinueFromUsb}
            />
          ) : null}

          {step === STEP_TYPES.CONFIRM_DELETE ? (
            <SimpleChoiceScreen
              question={t('delete_records_after_download')}
              choices={deleteChoices}
              selected={deleteAfterDownload}
              onSelect={setDeleteAfterDownload}
              onContinue={handleContinueFromConfirmDelete}
            />
          ) : null}

          {step === STEP_TYPES.DOWNLOADING ? (
            <SpinnerScreen statusText={t('downloading_all_protocol_files')} />
          ) : null}

          {step === STEP_TYPES.DELETING ? (
            <SpinnerScreen statusText={t('deleting_all_run_records')} />
          ) : null}

          {step === STEP_TYPES.SUCCESS ? (
            <SuccessScreen
              message={t('all_protocol_files_downloaded')}
              onFinish={onClose}
            />
          ) : null}

          {step === STEP_TYPES.ERROR ? (
            <ErrorScreen subText={errorSubText} onExit={onClose} />
          ) : null}
        </div>
      </div>
    </div>,
    getTopPortalEl()
  )
}
