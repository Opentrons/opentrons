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
import { TertiaryButton } from '../../../../atoms/Buttons'
import { downloadLogs } from '../../../../redux/shell/robot-logs/actions'
import { getRobotLogsDownloading } from '../../../../redux/shell/robot-logs/selectors'
import { CONNECTABLE } from '../../../../redux/discovery'
import type { Dispatch } from '../../../../redux/types'
import { ViewableRobot } from '../../../../redux/discovery/types'

interface TroubleshootingProps {
  robot: ViewableRobot
}

export function Troubleshooting({ robot }: TroubleshootingProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  const controlDisabled = robot?.status !== CONNECTABLE
  const logsAvailable = robot?.health != null && robot?.health.logs
  const robotLogsDownloading = useSelector(getRobotLogsDownloading)

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          as="h3"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacingM}
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
        onClick={() => dispatch(downloadLogs(robot))}
        id="AdvancedSettings_downloadLogsButton"
      >
        {t('update_robot_software_download_logs')}
      </TertiaryButton>
    </Flex>
  )
}
