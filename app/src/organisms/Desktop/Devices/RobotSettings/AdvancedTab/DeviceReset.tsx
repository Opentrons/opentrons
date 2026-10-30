import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  SPACING_AUTO,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'

import type { MouseEventHandler, ReactNode } from 'react'

interface DeviceResetProps {
  updateIsExpanded: (
    isExpanded: boolean,
    type: 'deviceReset' | 'renameRobot'
  ) => void
  isRobotBusy: boolean
}

export function DeviceReset({
  updateIsExpanded,
  isRobotBusy,
}: DeviceResetProps): ReactNode {
  const { t } = useTranslation('device_settings')

  const handleClick: MouseEventHandler<HTMLButtonElement> = () => {
    if (!isRobotBusy) {
      updateIsExpanded(true, 'deviceReset')
    }
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          forwardedAs="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacing4}
        >
          {t('device_reset')}
        </StyledText>
        <StyledText forwardedAs="p">{t('device_reset_description')}</StyledText>
      </Box>
      <TertiaryButton
        marginLeft={SPACING_AUTO}
        onClick={handleClick}
        disabled={isRobotBusy}
      >
        {t('choose_reset_settings')}
      </TertiaryButton>
    </Flex>
  )
}
