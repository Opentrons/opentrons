import { useTranslation } from 'react-i18next'

import {
  ALIGN_END,
  ERROR_TOAST,
  INFO_TOAST,
  SPACING_AUTO,
  SUCCESS_TOAST,
} from '@opentrons/components'
import {
  useLogLevelQuery,
  usePostLogLevelMutation,
} from '@opentrons/react-api-client'

import { TertiaryButton, ToggleButton } from '/app/atoms/buttons'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { isFileSaveCanceledError } from '/app/local-resources/files/fileSaveCanceledError'
import { useToaster } from '/app/organisms/ToasterOven'
import { useDownloadRobotLogs } from '/app/resources/devices/hooks'

import styles from './troubleshooting.module.css'

import type { MouseEventHandler, ReactNode } from 'react'
import type { IconProps } from '@opentrons/components'

interface TroubleshootingProps {
  robotName: string
}

export function Troubleshooting({
  robotName,
}: TroubleshootingProps): ReactNode {
  const { t } = useTranslation(['device_settings', 'device_details'])
  const { makeToast, eatToast } = useToaster()
  const {
    mutateAsync: downloadLogs,
    status: downloadLogsStatus,
    canDownload,
  } = useDownloadRobotLogs(robotName)
  const documentationState = useDocumentationState()
  const robotLogLevel = useLogLevelQuery()
  const { postLogLevel } = usePostLogLevelMutation(documentationState)

  const handleClickDownload: MouseEventHandler<HTMLButtonElement> = () => {
    if (downloadLogsStatus !== 'loading') {
      const toastIcon: IconProps = { name: 'ot-spinner', spin: true }
      const toastId = makeToast(t('downloading_logs') as string, INFO_TOAST, {
        disableTimeout: true,
        icon: toastIcon,
      })
      void downloadLogs({})
        .then(() => {
          makeToast(
            t('device_details:files_successfully_downloaded') as string,
            SUCCESS_TOAST
          )
        })
        .catch((e: Error) => {
          if (!isFileSaveCanceledError(e)) {
            makeToast(e.message, ERROR_TOAST, { closeButton: true })
          }
        })
        .finally(() => {
          eatToast(toastId)
        })
    }
  }

  const DEBUG_LEVELS = ['info', 'debug']
  const debugLogsEnabled = DEBUG_LEVELS.includes(
    robotLogLevel?.data?.log_level ?? 'unknown'
  )

  const handleClickDebugLogs: MouseEventHandler<Element> = () => {
    postLogLevel(debugLogsEnabled ? 'warning' : 'debug')
  }

  return (
    <div className={styles.section_container}>
      <h3 className={styles.header}>{t('troubleshooting')}</h3>
      <div className={styles.option_row}>
        <p
          data-testid="RobotSettings_Troubleshooting_Download"
          className={styles.option_name}
        >
          {t('download_logs')}
        </p>
        <TertiaryButton
          disabled={!canDownload || downloadLogsStatus === 'loading'}
          marginLeft={SPACING_AUTO}
          onClick={handleClickDownload}
          alignSelf={ALIGN_END}
        >
          {t('download_logs')}
        </TertiaryButton>
      </div>
      <div className={styles.option_row}>
        <div className={styles.option_name_container}>
          <p
            data-testid="RobotSettings_Troubleshooting_LogLevel_Title"
            className={styles.option_name}
          >
            {t('debug_logging')}
          </p>
          <p
            data-testid="RobotSettings_Troubleshooting_LogLevel_description"
            className={styles.option_description}
          >
            {t('debug_logging_description')}
          </p>
        </div>
        <ToggleButton
          label="debug_logs_enabled"
          toggledOn={debugLogsEnabled}
          onClick={handleClickDebugLogs}
          disabled={robotLogLevel.isLoading || robotLogLevel.isError}
        />
      </div>
    </div>
  )
}
