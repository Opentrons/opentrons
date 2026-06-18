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

interface UseOlderAspirateBehaviorProps {
  settings: RobotSettingsField | undefined
  robotName: string
  isRobotBusy: boolean
}

export function UseOlderAspirateBehavior({
  settings,
  robotName,
  isRobotBusy,
}: UseOlderAspirateBehaviorProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { updateRobotSetting } = useUpdateRobotSettingMutation()
  const value = settings?.value ? settings.value : false
  const id = settings?.id ? settings.id : 'useOldAspirationFunctions'

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
          id="AdvancedSettings_devTools"
        >
          {t('use_older_aspirate')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">
          {t('use_older_aspirate_description')}
        </LegacyStyledText>
      </Box>
      <ToggleButton
        label="use_older_aspirate_behavior"
        toggledOn={settings?.value === true}
        onClick={handleClick}
        id="AdvancedSettings_useOlderAspirate"
        disabled={isRobotBusy}
      />
    </Flex>
  )
}
