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
  console.log(robot?.status)
  const controlDisabled = robot?.status !== CONNECTABLE
  const logsAvailable = robot?.health != null && robot.health.logs
  const robotLogsDownloading = useSelector(getRobotLogsDownloading)

  const handleClick = (): void => {
    updateDownloadLogsStatus(robotLogsDownloading)
    if (!controlDisabled) dispatch(downloadLogs(robot))
  }

  React.useEffect(() => {
    updateDownloadLogsStatus(robotLogsDownloading)
  }, [robotLogsDownloading, updateDownloadLogsStatus])

  console.log('controlDisabled', controlDisabled)
  console.log('logsAvailable', logsAvailable)
  console.log('robotLogsDownloading', robotLogsDownloading)

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          as="h2"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacing4}
        >
          {t('update_robot_software_troubleshooting')}
        </StyledText>
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          data-testid="RobotSettings_Troubleshooting"
        >
          {t('update_robot_software_download_logs')}
        </StyledText>
      </Box>
      <TertiaryButton
        disabled={
          controlDisabled || logsAvailable == null || robotLogsDownloading
        }
        marginLeft={SPACING_AUTO}
        onClick={() => handleClick()}
        id="AdvancedSettings_downloadLogsButton"
      >
        {t('update_robot_software_download_logs')}
      </TertiaryButton>
    </Flex>
  )
}
