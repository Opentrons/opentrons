import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { WizardHeader } from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'

import { STEP_TYPES } from './constants'
import { ErrorScreen } from './ErrorScreen'
import styles from './shared.module.css'
import { SimpleChoiceScreen } from './SimpleChoiceScreen'
import { SpinnerScreen } from './SpinnerScreen'
import { SuccessScreen } from './SuccessScreen'
import { UsbSelectionScreen } from './UsbSelectionScreen'

import type { ReactNode } from 'react'
import type { StepType } from './types'

export type DeleteOutcome = 'deleted' | 'deletion_key_missing'

export interface DownloadDeleteRecordFlowCopy {
  title: string
  usbQuestion: string
  // only shown (and only required) when showChoiceScreen is true
  choiceQuestion?: string
  downloadingText: string
  deletingText: string
  successMessage: string
  downloadFailedText: string
  deleteFailedText: string
  // shown when onDelete resolves 'deletion_key_missing'; falls back to
  // deleteFailedText if omitted
  deletionKeyMissingText?: string
}

export interface DownloadDeleteRecordFlowProps<TDownloadResult> {
  copy: DownloadDeleteRecordFlowCopy
  // whether to ask the user whether to delete after downloading, or skip
  // straight to downloadAndOptionallyDelete using initialDeleteAfterDownload
  showChoiceScreen: boolean
  initialDeleteAfterDownload: boolean
  onDownload: (usbPath: string) => Promise<TDownloadResult>
  onDelete: (downloadResult: TDownloadResult) => Promise<DeleteOutcome>
  onClose: () => void
}

/**
 * Shared USB -> (delete after download?) -> downloading -> (deleting) -> success/error
 * wizard shell for the various download/delete-record flows in FileManagerWizardFlows.
 * Callers own their own data hooks and copy; this component owns only the step machine
 * and the WizardHeader/portal/screen chrome around it.
 */
export function DownloadDeleteRecordFlow<TDownloadResult>({
  copy,
  showChoiceScreen,
  initialDeleteAfterDownload,
  onDownload,
  onDelete,
  onClose,
}: DownloadDeleteRecordFlowProps<TDownloadResult>): ReactNode {
  const { t } = useTranslation('device_details')

  const [step, setStep] = useState<StepType>(STEP_TYPES.USB)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [deleteAfterDownload, setDeleteAfterDownload] = useState<boolean>(
    initialDeleteAfterDownload
  )
  const [errorSubText, setErrorSubText] = useState('')

  const isActiveStep =
    step === STEP_TYPES.DOWNLOADING || step === STEP_TYPES.DELETING
  const currentStepNumber =
    step === STEP_TYPES.USB ? 1 : step === STEP_TYPES.CONFIRM_DELETE ? 2 : null

  const isSuccessStep = step === STEP_TYPES.SUCCESS

  // when the choice screen is skipped, USB selection is the only step
  let totalSteps: number | null = showChoiceScreen ? 2 : 1
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

  const {
    choiceQuestion,
    deleteFailedText,
    deletingText,
    deletionKeyMissingText,
    downloadFailedText,
    downloadingText,
    successMessage,
    title,
    usbQuestion,
  } = copy

  const downloadAndOptionallyDelete = (
    path: string,
    shouldDelete: boolean
  ): void => {
    setStep(STEP_TYPES.DOWNLOADING)
    onDownload(path)
      .then(result => {
        if (!shouldDelete) {
          setStep(STEP_TYPES.SUCCESS)
          return
        }
        setStep(STEP_TYPES.DELETING)
        onDelete(result)
          .then(outcome => {
            if (outcome === 'deletion_key_missing') {
              setErrorSubText(deletionKeyMissingText ?? deleteFailedText)
              setStep(STEP_TYPES.ERROR)
              return
            }
            setStep(STEP_TYPES.SUCCESS)
          })
          .catch(() => {
            setErrorSubText(deleteFailedText)
            setStep(STEP_TYPES.ERROR)
          })
      })
      .catch(() => {
        setErrorSubText(downloadFailedText)
        setStep(STEP_TYPES.ERROR)
      })
  }

  const handleContinueFromUsb = (path: string): void => {
    setSelectedPath(path)
    if (showChoiceScreen) {
      setStep(STEP_TYPES.CONFIRM_DELETE)
    } else {
      downloadAndOptionallyDelete(path, initialDeleteAfterDownload)
    }
  }

  const handleContinueFromConfirmDelete = (): void => {
    // we should not be able to reach the selectedPath == null state
    if (selectedPath != null) {
      downloadAndOptionallyDelete(selectedPath, deleteAfterDownload)
    } else {
      setStep(STEP_TYPES.ERROR)
    }
  }

  const screens: Record<StepType, ReactNode | null> = {
    [STEP_TYPES.USB]: (
      <UsbSelectionScreen
        question={usbQuestion}
        onContinue={handleContinueFromUsb}
      />
    ),
    [STEP_TYPES.CONFIRM_DELETE]:
      choiceQuestion != null ? (
        <SimpleChoiceScreen
          question={choiceQuestion}
          choices={deleteChoices}
          selected={deleteAfterDownload}
          onSelect={setDeleteAfterDownload}
          onContinue={handleContinueFromConfirmDelete}
        />
      ) : null,
    [STEP_TYPES.DOWNLOADING]: <SpinnerScreen statusText={downloadingText} />,
    [STEP_TYPES.DELETING]: <SpinnerScreen statusText={deletingText} />,
    [STEP_TYPES.SUCCESS]: (
      <SuccessScreen message={successMessage} onFinish={onClose} />
    ),
    [STEP_TYPES.ERROR]: <ErrorScreen subText={errorSubText} onExit={onClose} />,
  }

  return createPortal(
    <div className={styles.overlay} aria-modal="true" role="dialog">
      <div className={styles.modal}>
        <WizardHeader
          title={title}
          onExit={onClose}
          totalSteps={totalSteps}
          currentStep={currentStep}
          hideStepText={isSuccessStep}
        />
        <div className={styles.body}>{screens[step]}</div>
      </div>
    </div>,
    getTopPortalEl()
  )
}
