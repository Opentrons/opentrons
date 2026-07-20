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
  const dispatch = useDispatch<Dispatch>()
  const value = settings?.value ? settings.value : false
  const id = settings?.id ? settings.id : 'disableHomeOnBoot'

  const handleClick: MouseEventHandler<Element> = () => {
    if (!isRobotBusy) {
      dispatch(updateSetting(robotName, id, !value))
    }
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <LegacyStyledText
          css={TYPOGRAPHY.pSemiBold}
          paddingBottom={SPACING.spacing4}
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
        disabled={isRobotBusy}
      />
    </Flex>
  )
}
