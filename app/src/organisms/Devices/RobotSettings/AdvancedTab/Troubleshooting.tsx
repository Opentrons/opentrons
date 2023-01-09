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
import { INFO_TOAST, useToast } from '../../../../atoms/Toast'
import { downloadLogs } from '../../../../redux/shell/robot-logs/actions'
import { getRobotLogsDownloading } from '../../../../redux/shell/robot-logs/selectors'
import { CONNECTABLE } from '../../../../redux/discovery'
import { useRobot } from '../../hooks'

import type { IconProps } from '@opentrons/components'
import type { Dispatch } from '../../../../redux/types'

interface TroubleshootingProps {
  robotName: string
}

export function Troubleshooting({
  robotName,
}: TroubleshootingProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  const robot = useRobot(robotName)
  const controlDisabled = robot?.status !== CONNECTABLE
  const logsAvailable = robot?.health != null && robot.health.logs
  const robotLogsDownloading = useSelector(getRobotLogsDownloading)
  const [toastId, setToastId] = React.useState<string | null>(null)
  const { makeToast, eatToast } = useToast()
  const toastIcon: IconProps = { name: 'ot-spinner', spin: true }

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    const newToastId = makeToast(t('downloading_logs'), INFO_TOAST, {
      icon: toastIcon,
    })
    setToastId(newToastId)
    if (!controlDisabled && robot?.status === CONNECTABLE)
      dispatch(downloadLogs(robot))
  }

  React.useEffect(() => {
    if (!robotLogsDownloading && toastId != null) {
      eatToast(toastId)
      setToastId(null)
    }
  }, [robotLogsDownloading, eatToast, toastId])

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
