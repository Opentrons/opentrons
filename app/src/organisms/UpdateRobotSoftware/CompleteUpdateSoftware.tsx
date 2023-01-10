import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  COLORS,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  Box,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { PrimaryButton } from '../../atoms/buttons'
import { ProgressBar } from '../../atoms/ProgressBar'
import { restartRobot } from '../../redux/robot-admin'

import type { Dispatch } from '../../redux/types'

interface CompleteUpdateSoftwareProps {
  robotName: string
}
export function CompleteUpdateSoftware({
  robotName,
}: CompleteUpdateSoftwareProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'robot_controls'])
  const dispatch = useDispatch<Dispatch>()

  const handleRestartRobot: React.MouseEventHandler<HTMLButtonElement> = e => {
    // ToDo kj 1/10/2023 Need to add a new config item to app-shell-odd to resume the process from nameRobot
    // OnDeviceDisplayApp.tsx needs to get a config
    e.preventDefault()
    dispatch(restartRobot(robotName))
  }
  return (
    <Flex flexDirection={DIRECTION_COLUMN} width="100%">
      <Flex
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.darkGreyDisabled}
        height="26.625rem"
        gridGap={SPACING.spacingXXL}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        <StyledText
          fontSize="2rem"
          lineHeight="2.75rem"
          fontWeight="700"
          color={COLORS.black}
        >
          {t('update_complete')}
        </StyledText>
        <Box width="47.5rem">
          <ProgressBar percentComplete={100} />
        </Box>
      </Flex>
      <PrimaryButton
        marginTop={SPACING.spacing6}
        height="4.4375rem"
        onClick={handleRestartRobot}
      >
        <StyledText fontSize="1.5rem" lineHeight="1.375rem" fontWeight="500">
          {t('robot_controls:restart_label')}
        </StyledText>
      </PrimaryButton>
    </Flex>
  )
}
