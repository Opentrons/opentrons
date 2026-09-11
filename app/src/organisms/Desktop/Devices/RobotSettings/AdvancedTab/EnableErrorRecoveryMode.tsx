import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ToggleButton } from '/app/atoms/buttons'
import { useErrorRecoverySettingsToggle } from '/app/resources/errorRecovery'

export function EnableErrorRecoveryMode({
  isRobotBusy,
}: {
  isRobotBusy: boolean
}): JSX.Element {
  const { t } = useTranslation('app_settings')
  const { isEREnabled, toggleERSettings } = useErrorRecoverySettingsToggle()

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginTop={SPACING.spacing24}
    >
      <Box width="70%">
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <LegacyStyledText
            forwardedAs="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {t('error_recovery_mode')}
          </LegacyStyledText>
          <LegacyStyledText forwardedAs="p">
            {t('error_recovery_mode_description')}
          </LegacyStyledText>
        </Flex>
      </Box>
      <ToggleButton
        label="enable_error_recovery_mode"
        toggledOn={isEREnabled}
        onClick={toggleERSettings}
        disabled={isRobotBusy}
      />
    </Flex>
  )
}
