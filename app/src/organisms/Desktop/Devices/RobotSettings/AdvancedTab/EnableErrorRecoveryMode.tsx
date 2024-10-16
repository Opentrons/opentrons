import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  LegacyStyledText,
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
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            id="AdvancedSettings_Error_Recovery_Mode"
          >
            {t('error_recovery_mode')}
          </LegacyStyledText>
          <LegacyStyledText as="p">
            {t('error_recovery_mode_description')}
          </LegacyStyledText>
        </Flex>
      </Box>
      <ToggleButton
        label="enable_error_recovery_mode"
        toggledOn={isEREnabled}
        onClick={toggleERSettings}
        disabled={isRobotBusy}
        id="RobotSettings_enableErrorRecoveryModeToggleButton"
      />
    </Flex>
  )
}
