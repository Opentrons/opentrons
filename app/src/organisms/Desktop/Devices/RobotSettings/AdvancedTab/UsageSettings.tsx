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

import type { MouseEventHandler } from 'react'
import type { RobotSettingsField } from '@opentrons/api-client'

interface UsageSettingsProps {
  settings: RobotSettingsField | undefined
  isRobotBusy: boolean
}

export function UsageSettings({
  settings,
  isRobotBusy,
}: UsageSettingsProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { updateRobotSetting } = useUpdateRobotSettingMutation()
  const value = settings?.value ? settings.value : false
  const id = settings?.id ? settings.id : 'enableDoorSafetySwitch'

  const handleClick: MouseEventHandler<Element> = () => {
    if (!isRobotBusy) {
      updateRobotSetting({ id, value: !value })
    }
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginTop={SPACING.spacing24}
    >
      <Box width="70%">
        <LegacyStyledText
          css={TYPOGRAPHY.h2SemiBold}
          marginBottom={SPACING.spacing16}
          id="AdvancedSettings_UsageSettings"
        >
          {t('usage_settings')}
        </LegacyStyledText>
        <LegacyStyledText
          forwardedAs="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacing4}
        >
          {t('pause_protocol')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">
          {t('pause_protocol_description')}
        </LegacyStyledText>
      </Box>
      <ToggleButton
        label="usage_settings_pause_protocol"
        toggledOn={settings?.value === true}
        onClick={handleClick}
        id="RobotSettings_usageSettingsToggleButton"
        disabled={isRobotBusy}
      />
    </Flex>
  )
}
