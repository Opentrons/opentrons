import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  SPACING,
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
      <LegacyStyledText
        forwardedAs="h3"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        {t('module_calibration')}
      </LegacyStyledText>
      <LegacyStyledText forwardedAs="p">
        {t('module_calibration_description')}
      </LegacyStyledText>
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
        <LegacyStyledText forwardedAs="label" marginTop={SPACING.spacing8}>
          {t('no_modules_attached')}
        </LegacyStyledText>
      )}
    </Flex>
  )
}
