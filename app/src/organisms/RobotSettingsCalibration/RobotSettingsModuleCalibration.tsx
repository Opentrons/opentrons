import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { ModuleCalibrationItems } from './CalibrationDetails/ModuleCalibrationItems'

import type { AttachedModule } from '@opentrons/api-client'
import type { FormattedPipetteOffsetCalibration } from '.'

interface RobotSettingsModuleCalibrationProps {
  attachedModules: AttachedModule[]
  updateRobotStatus: (isRobotBusy: boolean) => void
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
}

export function RobotSettingsModuleCalibration({
  attachedModules,
  updateRobotStatus,
  formattedPipetteOffsetCalibrations,
}: RobotSettingsModuleCalibrationProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      paddingY={SPACING.spacing24}
      gridGap={SPACING.spacing8}
    >
      <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('module_calibration')}
      </StyledText>
      <StyledText as="p">{t('module_calibration_description')}</StyledText>
      {attachedModules.length > 0 ? (
        <ModuleCalibrationItems
          attachedModules={attachedModules}
          updateRobotStatus={updateRobotStatus}
          formattedPipetteOffsetCalibrations={
            formattedPipetteOffsetCalibrations
          }
        />
      ) : (
        <StyledText as="label" marginTop={SPACING.spacing8}>
          {t('no_modules_attached')}
        </StyledText>
      )}
    </Flex>
  )
}
