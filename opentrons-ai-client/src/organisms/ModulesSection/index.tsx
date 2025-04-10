import {
  DIRECTION_COLUMN,
  Flex,
  InfoScreen,
  SPACING,
} from '@opentrons/components'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ControlledEmptySelectorButtonGroup } from '../../molecules/ControlledEmptySelectorButtonGroup'
import { ModuleListItemGroup } from '../../molecules/ModuleListItemGroup'
import { OPENTRONS_FLEX, ROBOT_FIELD_NAME } from '../InstrumentsSection'
import type { ModuleType, ModuleModel } from '@opentrons/shared-data'

export interface DisplayModules {
  type: ModuleType
  model: ModuleModel
  name: string
  adapter?: {
    name: string
    value: string
  }
}

export const MODULES_FIELD_NAME = 'modules'

export function ModulesSection(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const { watch } = useFormContext()
  const robotType = watch(ROBOT_FIELD_NAME)

  const allModules: DisplayModules[] = [
    {
      type: 'heaterShakerModuleType',
      model: 'heaterShakerModuleV1',
      name: t('heater_shaker_module_v1'),
    },
    {
      type: 'temperatureModuleType',
      model: 'temperatureModuleV2',
      name: t('temperature_module_v2'),
    },
    {
      type: 'thermocyclerModuleType',
      model: 'thermocyclerModuleV2',
      name: t('thermocycler_module_v2'),
    },
    {
      type: 'magneticModuleType',
      model: 'magneticModuleV2',
      name: t('magnetic_module_v2'),
    },
    {
      type: 'absorbanceReaderType',
      model: 'absorbanceReaderV1',
      name: t('absorbance_plate_reader_module_v1'),
    },
    {
      type: 'magneticBlockType',
      model: 'magneticBlockV1',
      name: t('magnetic_block_v1'),
    },
  ]

  const modules =
    robotType === OPENTRONS_FLEX
      ? allModules.filter(
          module =>
            module.type === 'heaterShakerModuleType' ||
            module.type === 'temperatureModuleType' ||
            module.type === 'thermocyclerModuleType' ||
            module.type === 'absorbanceReaderType' ||
            module.type === 'magneticBlockType'
        )
      : allModules.filter(
          // For OT-2 or default case
          module =>
            module.type === 'heaterShakerModuleType' ||
            module.type === 'temperatureModuleType' ||
            module.type === 'thermocyclerModuleType' ||
            module.type === 'magneticModuleType'
        )

  const modulesWatch: DisplayModules[] = watch(MODULES_FIELD_NAME) ?? []

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="100%"
      gap={SPACING.spacing24}
    >
      <ControlledEmptySelectorButtonGroup modules={modules} />

      {modulesWatch.length === 0 && (
        <InfoScreen content={t('no_modules_added_yet')} />
      )}

      <ModuleListItemGroup />
    </Flex>
  )
}
