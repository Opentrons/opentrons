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

import { STEP_TYPES } from '../shared/constants'
import { ErrorScreen } from '../shared/ErrorScreen'
import styles from '../shared/shared.module.css'
import { SimpleChoiceScreen } from '../shared/SimpleChoiceScreen'
import { SpinnerScreen } from '../shared/SpinnerScreen'
import { SuccessScreen } from '../shared/SuccessScreen'
import { UsbSelectionScreen } from '../shared/UsbSelectionScreen'

import type { StepType } from '../shared/types'

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
  const { downloadRuns } = useDownloadSelectedRuns(robotName)
  const { deleteSelectedRuns } = useDeleteSelectedRuns(documentationState)

  const isActiveStep =
    step === STEP_TYPES.DOWNLOADING || step === STEP_TYPES.DELETING
  const currentStepNumber =
    step === STEP_TYPES.USB ? 1 : step === STEP_TYPES.CONFIRM_DELETE ? 2 : null

  const isSuccessStep = step === STEP_TYPES.SUCCESS

  let totalSteps: number | null = 2
  let currentStep: number | null = currentStepNumber
  if (isSuccessStep) {
    totalSteps = 1
    currentStep = 1
  } else if (isActiveStep) {
    totalSteps = null
    currentStep = null
  }

  const deleteChoices = [
    { value: true, label: t('yes') },
    { value: false, label: t('no') },
  ]

  const handleContinueFromUsb = (path: string): void => {
    setSelectedPath(path)
    setStep(STEP_TYPES.CONFIRM_DELETE)
  }

  const handleContinueFromConfirmDelete = (): void => {
    // we should not be able to reach the selectedPath == null state
    if (selectedPath != null) {
      setStep(STEP_TYPES.DOWNLOADING)
      downloadRuns(allRuns, selectedPath)
        .then(() => {
          if (!deleteAfterDownload) {
            setStep(STEP_TYPES.SUCCESS)
            return
          }
          setStep(STEP_TYPES.DELETING)
          deleteSelectedRuns(allRuns)
            .then(() => {
              setStep(STEP_TYPES.SUCCESS)
            })
            .catch(() => {
              setErrorSubText(t('run_records_delete_failed') as string)
              setStep(STEP_TYPES.ERROR)
            })
        })
        .catch(() => {
          setErrorSubText(t('run_records_download_failed') as string)
          setStep(STEP_TYPES.ERROR)
        })
    } else {
      setStep(STEP_TYPES.ERROR)
    }
  }

  return createPortal(
    <div className={styles.overlay} aria-modal="true" role="dialog">
      <div className={styles.modal}>
        <WizardHeader
          title={t('download_all_protocol_run_records')}
          onExit={onClose}
          totalSteps={totalSteps}
          currentStep={currentStep}
          hideStepText={isSuccessStep}
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
