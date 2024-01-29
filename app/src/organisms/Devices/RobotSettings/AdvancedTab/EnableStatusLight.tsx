import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../../../atoms/text'
import { ToggleButton } from '../../../../atoms/buttons'
import { useLEDLights } from '../../hooks'

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
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            id="AdvancedSettings_Enable_Status_Light"
          >
            {t('enable_status_light')}
          </StyledText>
          <StyledText as="p">{t('enable_status_light_description')}</StyledText>
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
