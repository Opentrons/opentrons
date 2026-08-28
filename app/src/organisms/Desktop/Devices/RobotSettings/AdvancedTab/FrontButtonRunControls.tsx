import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ToggleButton } from '/app/atoms/buttons'
import { updateSetting } from '/app/redux/robot-settings'

import type { MouseEventHandler } from 'react'
import type { RobotSettingsField } from '/app/redux/robot-settings/types'
import type { Dispatch } from '/app/redux/types'

interface FrontButtonRunControlsProps {
  settings: RobotSettingsField | undefined
  robotName: string
  isRobotBusy: boolean
}

export function FrontButtonRunControls({
  settings,
  robotName,
  isRobotBusy,
}: FrontButtonRunControlsProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  const value = settings?.value ? settings.value : false
  const id = settings?.id ? settings.id : 'disableOT2FrontButton'

  const handleClick: MouseEventHandler<Element> = () => {
    if (!isRobotBusy) {
      dispatch(updateSetting(robotName, id, !value))
    }
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <LegacyStyledText
          forwardedAs="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacing4}
          id="AdvancedSettings_frontButtonRunControls"
        >
          {t('front_button_run_controls')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">
          {t('front_button_run_controls_description')}
        </LegacyStyledText>
      </Box>
      <ToggleButton
        label="front_button_run_controls"
        toggledOn={!value}
        onClick={handleClick}
        id="RobotSettings_frontButtonRunControlsToggleButton"
        disabled={isRobotBusy}
      />
    </Flex>
  )
}
