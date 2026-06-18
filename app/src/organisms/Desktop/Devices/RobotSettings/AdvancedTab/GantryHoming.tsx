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

interface GantryHomingProps {
  settings: RobotSettingsField | undefined
  robotName: string
  isRobotBusy: boolean
}

export function GantryHoming({
  settings,
  robotName,
  isRobotBusy,
}: GantryHomingProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { updateRobotSetting } = useUpdateRobotSettingMutation()
  const value = settings?.value ? settings.value : false
  const id = settings?.id ? settings.id : 'disableHomeOnBoot'

  const handleClick: MouseEventHandler<Element> = () => {
    if (!isRobotBusy) {
      updateRobotSetting({ id, value: !value })
    }
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <LegacyStyledText
          css={TYPOGRAPHY.pSemiBold}
          paddingBottom={SPACING.spacing4}
          id="AdvancedSettings_homing"
        >
          {t('gantry_homing')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">
          {t('gantry_homing_description')}
        </LegacyStyledText>
      </Box>
      <ToggleButton
        label="gantry_homing"
        toggledOn={!value}
        onClick={handleClick}
        id="RobotSettings_gantryHomingToggleButton"
        disabled={isRobotBusy}
      />
    </Flex>
  )
}
