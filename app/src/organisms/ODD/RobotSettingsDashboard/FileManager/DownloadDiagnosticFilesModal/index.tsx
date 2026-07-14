import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  Icon,
  RadioButton,
  StyledText,
  WizardHeader,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import SuccessIcon from '/app/assets/images/icon_success.png'
import { SmallButton } from '/app/atoms/buttons'
import {
  useDownloadCalibrationData,
  useDownloadRobotLogs,
} from '/app/resources/devices/hooks'
import { getLocalRobot } from '/app/redux/discovery'
import { getShellUsbMountPaths } from '/app/redux/shell'

import styles from './downloaddiagnosticfilesmodal.module.css'

import type { State } from '/app/redux/types'

type DownloadStatus = 'select' | 'downloading' | 'success'

interface DownloadDiagnosticFilesModalProps {
  onClose: () => void
}

export function DownloadDiagnosticFilesModal({
  onClose,
}: DownloadDiagnosticFilesModalProps): JSX.Element {
  const { t, i18n } = useTranslation(['device_details', 'shared'])
  const robotName = useSelector(getLocalRobot)?.name ?? ''
  const usbMountPaths = useSelector((state: State) =>
    getShellUsbMountPaths(state)
  )
  const [selectedPath, setSelectedPath] = useState<string | null>(
    usbMountPaths[0] ?? null
  )
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>('select')
  const didStartDownloadRef = useRef(false)

  const { downloadLogs, isDownloading, hasError } = useDownloadRobotLogs(
    robotName,
    selectedPath ?? undefined
  )
  const { downloadCalibration } = useDownloadCalibrationData(
    robotName,
    selectedPath ?? undefined
  )

  useEffect(() => {
    if (downloadStatus !== 'downloading') {
      return
    }
    if (isDownloading) {
      didStartDownloadRef.current = true
    } else if (didStartDownloadRef.current) {
      if (hasError) {
        didStartDownloadRef.current = false
        setDownloadStatus('select')
      } else {
        setDownloadStatus('success')
      }
    }
  }, [downloadStatus, isDownloading, hasError])

  const getUsbLabel = (index: number): string =>
    usbMountPaths.length > 1
      ? t('device_details:usb_drive_number', { number: index + 1 })
      : t('device_details:usb_drive')

  const handleContinue = (): void => {
    setDownloadStatus('downloading')
    downloadLogs()
    downloadCalibration()
  }

  return createPortal(
    <div className={styles.overlay} aria-modal="true" role="dialog">
      <div className={styles.modal}>
        <WizardHeader
          title={t('device_details:download_diagnostic_files')}
          onExit={onClose}
          totalSteps={downloadStatus === 'success' ? 1 : null}
          currentStep={downloadStatus === 'success' ? 1 : null}
          hideStepText={downloadStatus === 'success'}
        />
        <div className={styles.body}>
          {downloadStatus === 'select' ? (
            <>
              {usbMountPaths.length > 0 ? (
                <>
                  <div className={styles.usb_content}>
                    <StyledText
                      oddStyle="level4HeaderSemiBold"
                      className={styles.question}
                    >
                      {t('device_details:which_usb_device')}
                    </StyledText>
                    <div className={styles.radio_list}>
                      {usbMountPaths.map((path, idx) => (
                        <RadioButton
                          key={path}
                          buttonLabel={getUsbLabel(idx)}
                          buttonValue={path}
                          isSelected={selectedPath === path}
                          onChange={e => {
                            setSelectedPath(e.target.value)
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className={styles.buttons}>
                    <SmallButton
                      buttonText={i18n.format(
                        t('shared:continue'),
                        'capitalize'
                      )}
                      onClick={handleContinue}
                    />
                  </div>
                </>
              ) : (
                <div className={styles.no_usb_block}>
                  <div className={styles.no_usb_icon}>
                    <Icon name="ot-alert" size="2.5rem" />
                  </div>
                  <StyledText
                    oddStyle="level4HeaderBold"
                    className={styles.no_usb_header}
                  >
                    {t('device_details:no_usb_connected')}
                  </StyledText>
                  <StyledText
                    oddStyle="bodyTextRegular"
                    className={styles.no_usb_subtext}
                  >
                    {t('device_details:connect_usb_to_download')}
                  </StyledText>
                </div>
              )}
            </>
          ) : null}

          {downloadStatus === 'downloading' ? (
            <div className={styles.centered_content}>
              <Icon name="ot-spinner" spin size="6.25rem" />
              <StyledText
                oddStyle="level3HeaderBold"
                className={styles.status_text}
              >
                {t('device_details:downloading_diagnostic_files')}
              </StyledText>
            </div>
          ) : null}

          {downloadStatus === 'success' ? (
            <>
              <div className={styles.centered_content}>
                <img
                  src={SuccessIcon}
                  width="250"
                  height="208"
                  alt=""
                  aria-hidden="true"
                />
                <StyledText
                  oddStyle="level3HeaderBold"
                  className={styles.status_text}
                >
                  {t('device_details:all_diagnostic_files_downloaded')}
                </StyledText>
              </div>
              <div className={styles.buttons}>
                <SmallButton
                  buttonText={i18n.format(t('shared:finish'), 'capitalize')}
                  onClick={onClose}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    getTopPortalEl()
  )
}
