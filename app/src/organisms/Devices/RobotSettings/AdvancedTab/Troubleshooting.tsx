import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'

import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Box,
  SPACING,
  SPACING_AUTO,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { TertiaryButton } from '../../../../atoms/buttons'
import { downloadLogs } from '../../../../redux/shell/robot-logs/actions'
import { getRobotLogsDownloading } from '../../../../redux/shell/robot-logs/selectors'
import { CONNECTABLE } from '../../../../redux/discovery'
import { useRobot } from '../../hooks'

import type { Dispatch } from '../../../../redux/types'

interface TroubleshootingProps {
  robotName: string
  updateDownloadLogsStatus: (status: boolean) => void
}

export function Troubleshooting({
  robotName,
  updateDownloadLogsStatus,
}: TroubleshootingProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  const robot = useRobot(robotName)
  const controlDisabled = robot?.status !== CONNECTABLE
  const logsAvailable = robot?.health != null && robot.health.logs
  const robotLogsDownloading = useSelector(getRobotLogsDownloading)

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    updateDownloadLogsStatus(robotLogsDownloading)
    if (!controlDisabled && robot?.status === CONNECTABLE)
      dispatch(downloadLogs(robot))
  }

  React.useEffect(() => {
    updateDownloadLogsStatus(robotLogsDownloading)
  }, [robotLogsDownloading, updateDownloadLogsStatus])

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginTop={SPACING.spacing5}
    >
      <Box width="70%">
        <StyledText
          as="h3"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacingM}
        >
          {t('troubleshooting')}
        </StyledText>
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          data-testid="RobotSettings_Troubleshooting"
        >
          {t('download_logs')}
        </StyledText>
      </Box>
      <TertiaryButton
        disabled={
          controlDisabled || logsAvailable == null || robotLogsDownloading
        }
        marginLeft={SPACING_AUTO}
        onClick={handleClick}
        id="AdvancedSettings_downloadLogsButton"
      >
        {t('download_logs')}
      </TertiaryButton>
    </Flex>
  )
}
