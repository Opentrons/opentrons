import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ToggleButton } from '/app/atoms/buttons'
import { useLEDLights } from '/app/resources/robot-settings'

interface EnableStatusLightProps {
  isEstopNotDisengaged: boolean
}
export function EnableStatusLight({
  isEstopNotDisengaged,
}: EnableStatusLightProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { lightsEnabled, toggleLights } = useLEDLights()

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginTop={SPACING.spacing24}
    >
      <Box width="70%">
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <LegacyStyledText
            forwardedAs="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            id="AdvancedSettings_Enable_Status_Light"
          >
            {t('enable_status_light')}
          </LegacyStyledText>
          <LegacyStyledText forwardedAs="p">
            {t('enable_status_light_description')}
          </LegacyStyledText>
        </Flex>
      </Box>
      <ToggleButton
        label="enable_status_light"
        toggledOn={lightsEnabled}
        onClick={toggleLights}
        id="RobotSettings_enableStatusLightToggleButton"
        disabled={isEstopNotDisengaged}
      />
    </Flex>
  )
}
