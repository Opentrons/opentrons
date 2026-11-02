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

import type { Dispatch, ReactNode, SetStateAction } from 'react'

interface FactoryModeProps {
  isRobotBusy: boolean
  setShowFactoryModeSlideout: Dispatch<SetStateAction<boolean>>
  sn: string | null
}

export function FactoryMode({
  isRobotBusy,
  setShowFactoryModeSlideout,
  sn,
}: FactoryModeProps): ReactNode {
  const { t } = useTranslation('device_settings')

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginTop={SPACING.spacing24}
    >
      <Box width="70%">
        <StyledText forwardedAs="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('factory_mode')}
        </StyledText>
      </Box>
      <TertiaryButton
        disabled={isRobotBusy || sn == null}
        marginLeft={SPACING_AUTO}
        onClick={() => {
          setShowFactoryModeSlideout(true)
        }}
      >
        {t('setup_mode')}
      </TertiaryButton>
    </Flex>
  )
}
