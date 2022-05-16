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
interface DisableHomingProps {
  settings: RobotSettingsField | undefined
  robotName: string
}

export function DisableHoming({
  settings,
  robotName,
}: DisableHomingProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  const value = settings?.value ? settings.value : false
  const id = settings?.id ? settings.id : 'disableHomeOnBoot'

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          as="h2"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          paddingBottom={SPACING.spacing4}
          id="AdvancedSettings_disableHoming"
        >
          {t('disable_homing')}
        </StyledText>

        <StyledText as="p">{t('disable_homing_description')}</StyledText>
      </Box>
      <ToggleButton
        label="disable_homing"
        toggledOn={value}
        onClick={() => dispatch(updateSetting(robotName, id, !value))}
        id="RobotSettings_disableHomingToggleButton"
      />
    </Flex>
  )
}
