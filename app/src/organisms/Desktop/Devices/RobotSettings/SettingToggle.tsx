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

interface SettingToggleProps extends RobotSettingsField {
  robotName: string
  /**
   * invert the meaning of the setting sent over from the robot
   * this is helpful when a value the robot exposes "disables" something
   * and the user experience of the app prefers "enabling"
   */
  invert?: boolean
}

export function SettingToggle({
  value,
  id,
  title,
  description,
  robotName,
  invert = false,
}: SettingToggleProps): JSX.Element | null {
  const { updateRobotSetting } = useUpdateRobotSettingMutation()

  if (id == null) return null

  const handleClick: MouseEventHandler<Element> = () => {
    updateRobotSetting({ id, value: !value })
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginBottom={SPACING.spacing16}
    >
      <Box width="70%">
        <LegacyStyledText
          css={TYPOGRAPHY.pSemiBold}
          paddingBottom={SPACING.spacing4}
        >
          {title}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">{description}</LegacyStyledText>
      </Box>
      <ToggleButton
        label={title}
        toggledOn={invert ? value === false : value === true}
        onClick={handleClick}
      />
    </Flex>
  )
}
