import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  FLEX_MAX_CONTENT,
  JUSTIFY_CENTER,
  SPACING,
  StyledText,
  TertiaryButton,
} from '@opentrons/components'

import type { ReactNode } from 'react'
import type { LiquidHandlingTab } from '../../types'

interface ResetSettingsFieldProps {
  tab: LiquidHandlingTab
  onClick: () => void
}

export function ResetSettingsField(props: ResetSettingsFieldProps): ReactNode {
  const { tab, onClick } = props
  const { t } = useTranslation(['protocol_steps'])

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={`0 ${SPACING.spacing16}`}
      paddingBottom={SPACING.spacing40}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
    >
      <TertiaryButton
        onClick={onClick}
        buttonType="white"
        width={FLEX_MAX_CONTENT}
      >
        <StyledText desktopStyle="captionSemiBold">
          {t(`protocol_steps:reset_settings`, { tab })}
        </StyledText>
      </TertiaryButton>
    </Flex>
  )
}
