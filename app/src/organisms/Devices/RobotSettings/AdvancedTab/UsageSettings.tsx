import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Box,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../../../atoms/text'
import { ToggleButton } from '../../../../atoms/buttons'
import { updateSetting } from '../../../../redux/robot-settings'

import type { Dispatch } from '../../../../redux/types'
import type { RobotSettingsField } from '../../../../redux/robot-settings/types'

interface UsageSettingsProps {
  settings: RobotSettingsField | undefined
  robotName: string
}

export function UsageSettings({
  settings,
  robotName,
}: UsageSettingsProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  const value = settings?.value ? settings.value : false
  const id = settings?.id ? settings.id : 'enableDoorSafetySwitch'

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          as="h2"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          paddingBottom={SPACING.spacing4}
          id="AdvancedSettings_UsageSettings"
        >
          {t('usage_settings')}
        </StyledText>
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('pause_protocol')}
        </StyledText>
        <StyledText as="p">{t('pause_protocol_description')}</StyledText>
      </Box>
      <ToggleButton
        label="usage_settings_pause_protocol"
        toggledOn={settings?.value === true}
        onClick={() => dispatch(updateSetting(robotName, id, !value))}
        id="RobotSettings_usageSettingsToggleButton"
      />
    </Flex>
  )
}
