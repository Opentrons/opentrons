import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  SPACING,
  Box,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { ToggleButton } from '../../../../atoms/buttons'
import { updateSetting } from '../../../../redux/robot-settings'

import type { Dispatch } from '../../../../redux/types'
import type { RobotSettingsField } from '../../../../redux/robot-settings/types'

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

  const handleClick: React.MouseEventHandler<Element> = () => {
    if (!isRobotBusy) {
      dispatch(updateSetting(robotName, id, !value))
    }
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          css={TYPOGRAPHY.pSemiBold}
          paddingBottom={SPACING.spacing4}
          id="AdvancedSettings_homing"
        >
          {t('gantry_homing')}
        </StyledText>
        <StyledText as="p">{t('gantry_homing_description')}</StyledText>
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
