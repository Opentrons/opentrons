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
import { useDisableVacuumModuleWasteDetection } from '/app/resources/robot-settings'

interface DisableVacuumModuleWasteDetectionProps {
  robotName: string
  isRobotBusy: boolean
}

export function DisableVacuumModuleWasteDetection({
  robotName,
  isRobotBusy,
}: DisableVacuumModuleWasteDetectionProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { wasteDetectionDisabled, toggleWasteDetection } =
    useDisableVacuumModuleWasteDetection(robotName)

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <LegacyStyledText
          css={TYPOGRAPHY.pSemiBold}
          paddingBottom={SPACING.spacing4}
          id="AdvancedSettings_disableVacuumModuleWasteDetection"
        >
          {t('disable_vacuum_module_waste_detection')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">
          {t('disable_vacuum_module_waste_detection_description')}
        </LegacyStyledText>
      </Box>
      <ToggleButton
        label="disable_vacuum_module_waste_detection"
        toggledOn={wasteDetectionDisabled}
        onClick={toggleWasteDetection}
        id="RobotSettings_DisableVacuumModuleWasteDetectionToggleButton"
        disabled={isRobotBusy}
      />
    </Flex>
  )
}
