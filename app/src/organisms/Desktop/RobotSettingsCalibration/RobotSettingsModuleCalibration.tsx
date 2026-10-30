import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ModuleCalibrationItems } from './CalibrationDetails/ModuleCalibrationItems'

import type { ReactNode } from 'react'
import type { AttachedModule } from '@opentrons/api-client'
import type { FormattedPipetteOffsetCalibration } from '.'

interface RobotSettingsModuleCalibrationProps {
  attachedModules: AttachedModule[]
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
  robotName: string
  isRobotBusy: boolean
}

export function RobotSettingsModuleCalibration({
  attachedModules,
  formattedPipetteOffsetCalibrations,
  robotName,
  isRobotBusy,
}: RobotSettingsModuleCalibrationProps): ReactNode {
  const { t } = useTranslation('device_settings')

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      paddingY={SPACING.spacing24}
      gridGap={SPACING.spacing8}
    >
      <StyledText forwardedAs="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('module_calibration')}
      </StyledText>
      <StyledText forwardedAs="p">
        {t('module_calibration_description')}
      </StyledText>
      {attachedModules.length > 0 ? (
        <ModuleCalibrationItems
          attachedModules={attachedModules}
          formattedPipetteOffsetCalibrations={
            formattedPipetteOffsetCalibrations
          }
          robotName={robotName}
          isRobotBusy={isRobotBusy}
        />
      ) : (
        <StyledText forwardedAs="label" marginTop={SPACING.spacing8}>
          {t('no_modules_attached')}
        </StyledText>
      )}
    </Flex>
  )
}
