import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ToggleButton } from '/app/atoms/buttons'
import { useDisableVacuumModuleWasteDetection } from '/app/resources/robot-settings'

import type { ReactNode } from 'react'

interface DisableVacuumModuleWasteDetectionProps {
  isRobotBusy: boolean
}

export function DisableVacuumModuleWasteDetection({
  isRobotBusy,
}: DisableVacuumModuleWasteDetectionProps): ReactNode {
  const { t } = useTranslation('device_settings')
  const { wasteDetectionDisabled, toggleWasteDetection } =
    useDisableVacuumModuleWasteDetection()

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          forwardedAs="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          paddingBottom={SPACING.spacing4}
        >
          {t('disable_vacuum_module_waste_detection')}
        </StyledText>
        <StyledText forwardedAs="p">
          {t('disable_vacuum_module_waste_detection_description')}
        </StyledText>
      </Box>
      <ToggleButton
        label="disable_vacuum_module_waste_detection"
        toggledOn={wasteDetectionDisabled}
        onClick={toggleWasteDetection}
        disabled={isRobotBusy}
      />
    </Flex>
  )
}
