import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { WizardHeader } from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { getLocalRobot } from '/app/redux/discovery'
import { useDownloadCalibrationData } from '/app/resources/devices/hooks/useDownloadCalibrationData'
import { useDownloadRobotLogs } from '/app/resources/devices/hooks/useDownloadRobotLogs'

import { ErrorScreen } from '../shared/ErrorScreen'
import { SpinnerScreen } from '../shared/SpinnerScreen'
import { SuccessScreen } from '../shared/SuccessScreen'
import { UsbSelectionScreen } from '../shared/UsbSelectionScreen'

import styles from '../shared/shared.module.css'

import { STEP_TYPES } from './types'
import type { StepType } from './types'

interface DownloadDiagnosticFilesWizardProps {
  onClose: () => void
}

export function DownloadDiagnosticFilesWizard({
  onClose,
}: DownloadDiagnosticFilesWizardProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const robotName = useSelector(getLocalRobot)?.name ?? ''

  const [step, setStep] = useState<StepType>(STEP_TYPES.USB)
  const [errorSubText, setErrorSubText] = useState('')

  const { downloadLogs } = useDownloadRobotLogs(robotName)
  const { downloadCalibration } = useDownloadCalibrationData(robotName)

  const handleContinueFromUsb = (usbPath: string): void => {
    setStep(STEP_TYPES.DOWNLOADING)
    Promise.all([downloadLogs(usbPath), downloadCalibration(usbPath)])
      .then(() => {
        setStep(STEP_TYPES.SUCCESS)
      })
      .catch(() => {
        setErrorSubText(t('diagnostic_files_download_failed') as string)
        setStep(STEP_TYPES.ERROR)
      })
  }

  const isActiveStep = step === STEP_TYPES.DOWNLOADING

  return createPortal(
    <div className={styles.overlay} aria-modal="true" role="dialog">
      <div className={styles.modal}>
        <WizardHeader
          title={t('download_diagnostic_files')}
          onExit={onClose}
          totalSteps={isActiveStep || step === STEP_TYPES.SUCCESS ? null : 1}
          currentStep={isActiveStep || step === STEP_TYPES.SUCCESS ? null : 1}
          hideStepText={step === STEP_TYPES.SUCCESS}
        />
        <div className={styles.body}>
          {step === STEP_TYPES.USB ? (
            <UsbSelectionScreen
              question={t('which_usb_device')}
              onContinue={handleContinueFromUsb}
            />
          ) : null}

          {step === STEP_TYPES.DOWNLOADING ? (
            <SpinnerScreen statusText={t('downloading_diagnostic_files')} />
          ) : null}

          {step === STEP_TYPES.SUCCESS ? (
            <SuccessScreen
              message={t('all_diagnostic_files_downloaded')}
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
