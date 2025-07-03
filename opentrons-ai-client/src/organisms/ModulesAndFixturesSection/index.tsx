import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  Chip,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  InfoScreen,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { FixtureListItemGroup } from '/ai-client/molecules/FixtureListItemGroup'
import { FixturesButtonGroup } from '/ai-client/molecules/FixturesButtonGroup'
import { ModuleListItemGroup } from '/ai-client/molecules/ModuleListItemGroup'
import { ModulesButtonGroup } from '/ai-client/molecules/ModulesButtonGroup'

import { OPENTRONS_FLEX, ROBOT_FIELD_NAME } from '../InstrumentsSection'

import type { ModuleModel, ModuleType } from '@opentrons/shared-data'

export interface DisplayModule {
  id: string
  type: ModuleType
  model: ModuleModel
  name: string
  adapter?: {
    name: string
    value: string
  }
}

export type FixtureType = 'wasteChute' | 'trashBin' | 'stagingArea'

export interface DisplayFixture {
  type: FixtureType
  name: string
}

export const MODULES_FIELD_NAME = 'modules'
export const FIXTURES_FIELD_NAME = 'fixtures'

export function ModulesAndFixturesSection(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const { watch } = useFormContext()
  const robotType = watch(ROBOT_FIELD_NAME)

  const allModules: DisplayModule[] = [
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

  const allFixtures: DisplayFixture[] = [
    { type: 'wasteChute', name: t('waste_chute') },
    { type: 'trashBin', name: t('trash_bin') },
    { type: 'stagingArea', name: t('staging_area') },
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

  const modulesWatch: DisplayModule[] = watch(MODULES_FIELD_NAME) ?? []
  const fixturesWatch: DisplayFixture[] = watch(FIXTURES_FIELD_NAME) ?? []

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="100%"
      gap={SPACING.spacing24}
    >
      <Flex>
        <Chip
          text={t('optional')}
          type="neutral"
          background={true}
          chipSize="medium"
          hasIcon={false}
        />
      </Flex>
      <StyledText desktopStyle="headingSmallRegular">
        {t('modules_title')}
      </StyledText>
      <ModulesButtonGroup modules={modules} />
      {modulesWatch.length === 0 && (
        <InfoScreen content={t('no_modules_added_yet')} />
      )}
      <ModuleListItemGroup />
      {robotType === OPENTRONS_FLEX && (
        <>
          <Divider />
          <StyledText desktopStyle="headingSmallRegular">
            {t('fixtures_title')}
          </StyledText>
          <FixturesButtonGroup fixtures={allFixtures} />
          {fixturesWatch.length === 0 && (
            <InfoScreen content={t('no_fixtures_added_yet')} />
          )}
          <FixtureListItemGroup />
        </>
      )}
    </Flex>
  )
}
