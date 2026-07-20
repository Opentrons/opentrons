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
  robotName: string
  isEstopNotDisengaged: boolean
}
export function EnableStatusLight({
  robotName,
  isEstopNotDisengaged,
}: EnableStatusLightProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { lightsEnabled, toggleLights } = useLEDLights(robotName)

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
        disabled={isEstopNotDisengaged}
      />
    </Flex>
  )
}
