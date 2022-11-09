import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  Box,
  SPACING,
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { ToggleButton } from '../../../atoms/buttons'
import {
  updateSetting,
} from '../../../redux/robot-settings'
import type {  Dispatch } from '../../../redux/types'
import type { RobotSettingsField } from '../../../redux/robot-settings/types'


interface SettingToggleProps extends RobotSettingsField {
  robotName: string
  invert: boolean
}

export function SettingToggle({
  value,
  id,
  title,
  description,
  robotName,
  invert,
}: SettingToggleProps): JSX.Element | null {
  const dispatch = useDispatch<Dispatch>()

  if (id == null) return null

  const handleClick: React.MouseEventHandler<Element> = () => {
    dispatch(updateSetting(robotName, id, !value))
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginBottom={SPACING.spacing4}
    >
      <Box width="70%">
        <StyledText css={TYPOGRAPHY.pSemiBold} paddingBottom={SPACING.spacing2}>
          {title}
        </StyledText>
        <StyledText as="p">{description}</StyledText>
      </Box>
      <ToggleButton
        label={title}
        toggledOn={invert ? value === false : value === true}
        onClick={handleClick}
      />
    </Flex>
  )
}
