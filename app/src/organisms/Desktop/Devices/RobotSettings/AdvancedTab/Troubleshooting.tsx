import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  ALIGN_END,
  Box,
  ERROR_TOAST,
  Flex,
  INFO_TOAST,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  SPACING_AUTO,
  SUCCESS_TOAST,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'
import { isFileSaveCanceledError } from '/app/local-resources/files/saveFileWithPicker'
import { useToaster } from '/app/organisms/ToasterOven'
import { useDownloadRobotLogs } from '/app/resources/devices/hooks'

import type { MouseEventHandler } from 'react'
import type { IconProps } from '@opentrons/components'

interface TroubleshootingProps {
  robotName: string
}

export function Troubleshooting({
  robotName,
}: TroubleshootingProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'device_details'])
  const { makeToast, eatToast } = useToaster()
  const {
    mutateAsync: downloadLogs,
    status: downloadLogsStatus,
    canDownload,
  } = useDownloadRobotLogs(robotName)

  const handleClick: MouseEventHandler<HTMLButtonElement> = () => {
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

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginTop={SPACING.spacing24}
    >
      <Box width="70%">
        <LegacyStyledText
          forwardedAs="h3"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacing20}
        >
          {t('troubleshooting')}
        </LegacyStyledText>
        <LegacyStyledText
          forwardedAs="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          data-testid="RobotSettings_Troubleshooting"
        >
          {t('download_logs')}
        </LegacyStyledText>
      </Box>
      <TertiaryButton
        disabled={!canDownload || downloadLogsStatus === 'loading'}
        marginLeft={SPACING_AUTO}
        onClick={handleClick}
        alignSelf={ALIGN_END}
      >
        {t('download_logs')}
      </TertiaryButton>
    </Flex>
  )
}
