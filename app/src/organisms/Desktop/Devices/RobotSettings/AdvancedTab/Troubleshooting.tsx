import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  ALIGN_END,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  SPACING_AUTO,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'
import { useDownloadRobotLogs } from '/app/resources/devices/hooks'

import type { MouseEventHandler } from 'react'

interface TroubleshootingProps {
  robotName: string
}

export function Troubleshooting({
  robotName,
}: TroubleshootingProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { downloadLogs, isDownloading, canDownload } =
    useDownloadRobotLogs(robotName)

  const handleClick: MouseEventHandler<HTMLButtonElement> = () => {
    downloadLogs().catch(() => {})
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
        disabled={!canDownload || isDownloading}
        marginLeft={SPACING_AUTO}
        onClick={handleClick}
        id="AdvancedSettings_downloadLogsButton"
        alignSelf={ALIGN_END}
      >
        {t('download_logs')}
      </TertiaryButton>
    </Flex>
  )
}
