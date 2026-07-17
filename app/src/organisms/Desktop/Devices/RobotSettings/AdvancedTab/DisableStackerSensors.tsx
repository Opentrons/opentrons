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

import { ToggleButton } from '/app/atoms/buttons'
import { useDisableStackerSensors } from '/app/resources/robot-settings'

interface DisableStackerSensorsProps {
  isRobotBusy: boolean
}

export function DisableStackerSensors({
  isRobotBusy,
}: DisableStackerSensorsProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { sensorsDisabled, toggleSensors } = useDisableStackerSensors()

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <LegacyStyledText
          css={TYPOGRAPHY.pSemiBold}
          paddingBottom={SPACING.spacing4}
          id="AdvancedSettings_disableStackerSensors"
        >
          {t('disable_stacker_sensors')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">
          {t('disable_stacker_sensors_description')}
        </LegacyStyledText>
      </Box>
      <ToggleButton
        label="disable_stacker_sensors"
        toggledOn={sensorsDisabled}
        onClick={toggleSensors}
        id="RobotSettings_DisableStackerSensorsToggleButton"
        disabled={isRobotBusy}
      />
    </Flex>
  )
}
