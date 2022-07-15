import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  SPACING_AUTO,
  Box,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { TertiaryButton } from '../../../../atoms/buttons'
import { useIsRobotBusy } from '../../hooks'

interface FactoryResetProps {
  updateIsExpanded: (
    isExpanded: boolean,
    type: 'factoryReset' | 'renameRobot'
  ) => void
  updateIsRobotBusy: (isRobotBusy: boolean) => void
}

export function FactoryReset({
  updateIsExpanded,
  updateIsRobotBusy,
}: FactoryResetProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const isBusy = useIsRobotBusy()

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    if (isBusy) {
      updateIsRobotBusy(true)
    } else {
      updateIsExpanded(true, 'factoryReset')
    }
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          css={TYPOGRAPHY.pSemiBold}
          marginBottom={SPACING.spacing2}
          id="AdvancedSettings_factoryReset"
        >
          {t('factory_reset')}
        </StyledText>
        <StyledText as="p">{t('factory_reset_description')}</StyledText>
      </Box>
      <TertiaryButton
        marginLeft={SPACING_AUTO}
        onClick={handleClick}
        id="RobotSettings_FactoryResetChooseButton"
      >
        {t('factory_reset_settings_button')}
      </TertiaryButton>
    </Flex>
  )
}
