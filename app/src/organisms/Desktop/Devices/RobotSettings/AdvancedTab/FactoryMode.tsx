import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  SPACING_AUTO,
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
        <LegacyStyledText
          forwardedAs="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        >
          {t('factory_mode')}
        </LegacyStyledText>
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
