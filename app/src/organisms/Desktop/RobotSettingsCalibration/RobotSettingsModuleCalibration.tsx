import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ModuleCalibrationItems } from './CalibrationDetails/ModuleCalibrationItems'

import type { AttachedModule } from '@opentrons/api-client'
import type { FormattedPipetteOffsetCalibration } from '.'

interface RobotSettingsModuleCalibrationProps {
  attachedModules: AttachedModule[]
  updateRobotStatus: (isRobotBusy: boolean) => void
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
  robotName: string
}

export function RobotSettingsModuleCalibration({
  attachedModules,
  updateRobotStatus,
  formattedPipetteOffsetCalibrations,
  robotName,
}: RobotSettingsModuleCalibrationProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      paddingY={SPACING.spacing24}
      gridGap={SPACING.spacing8}
    >
      <LegacyStyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('module_calibration')}
      </LegacyStyledText>
      <LegacyStyledText as="p">
        {t('module_calibration_description')}
      </LegacyStyledText>
      {attachedModules.length > 0 ? (
        <ModuleCalibrationItems
          attachedModules={attachedModules}
          updateRobotStatus={updateRobotStatus}
          formattedPipetteOffsetCalibrations={
            formattedPipetteOffsetCalibrations
          }
          robotName={robotName}
        />
      ) : (
        <LegacyStyledText as="label" marginTop={SPACING.spacing8}>
          {t('no_modules_attached')}
        </LegacyStyledText>
      )}
    </Flex>
  )
}
