import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useUpdateRobotSettingMutation } from '@opentrons/react-api-client'

import { ToggleButton } from '/app/atoms/buttons'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/utils'

import type { MouseEventHandler } from 'react'
import type { RobotSettingsField } from '@opentrons/api-client'

interface LegacySettingsProps {
  settings: RobotSettingsField | undefined
  isRobotBusy: boolean
}

export function LegacySettings({
  settings,
  isRobotBusy,
}: LegacySettingsProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { updateRobotSetting } = useUpdateRobotSettingMutation(
    ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
  )
  const value = settings?.value ? settings.value : false
  const id = settings?.id ? settings.id : 'deckCalibrationDots'

  const handleClick: MouseEventHandler<Element> = () => {
    if (!isRobotBusy) {
      updateRobotSetting({ id, value: !value })
    }
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginTop={SPACING.spacing40}
    >
      <Box width="70%">
        <LegacyStyledText
          forwardedAs="h2"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacing16}
        >
          {t('legacy_settings')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p" css={TYPOGRAPHY.pSemiBold}>
          {t('calibrate_deck_to_dots')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">
          {t('calibrate_deck_description')}
        </LegacyStyledText>
      </Box>
      <ToggleButton
        label="legacy_settings"
        toggledOn={settings?.value === true}
        onClick={handleClick}
        disabled={isRobotBusy}
      />
    </Flex>
  )
}
