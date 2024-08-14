import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  DIRECTION_COLUMN,
  EmptySelectorButton,
  Flex,
  ListItem,
  ListItemCustomize,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  ABSORBANCE_READER_V1,
  FLEX_ROBOT_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  SPAN7_8_10_11_SLOT,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
  getModuleDisplayName,
  getModuleType,
} from '@opentrons/shared-data'
import { uuid } from '../../utils'
import {
  getEnableAbsorbanceReader,
  getEnableMoam,
} from '../../feature-flags/selectors'
import { ModuleDiagram } from '../../components/modules'
import { WizardBody } from './WizardBody'

import type { ModuleModel, ModuleType } from '@opentrons/shared-data'
import type { WizardTileProps } from './types'

const FLEX_SUPPORTED_MODULE_MODELS: ModuleModel[] = [
  THERMOCYCLER_MODULE_V2,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1,
  TEMPERATURE_MODULE_V2,
  ABSORBANCE_READER_V1,
]

const OT2_SUPPORTED_MODULE_MODELS: ModuleModel[] = [
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  HEATERSHAKER_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  TEMPERATURE_MODULE_V1,
]

export const DEFAULT_SLOT_MAP_FLEX: {
  [moduleModel in ModuleModel]?: string
} = {
  [THERMOCYCLER_MODULE_V2]: 'B1',
  [HEATERSHAKER_MODULE_V1]: 'D1',
  [MAGNETIC_BLOCK_V1]: 'D2',
  [TEMPERATURE_MODULE_V2]: 'C1',
  [ABSORBANCE_READER_V1]: 'D3',
}

export const DEFAULT_SLOT_MAP_OT2: { [moduleType in ModuleType]?: string } = {
  [THERMOCYCLER_MODULE_TYPE]: SPAN7_8_10_11_SLOT,
  [HEATERSHAKER_MODULE_TYPE]: '1',
  [MAGNETIC_MODULE_TYPE]: '1',
  [TEMPERATURE_MODULE_TYPE]: '3',
}

export function SelectModules(props: WizardTileProps): JSX.Element | null {
  const { goBack, proceed, watch, setValue } = props
  const { t } = useTranslation(['create_new_protocol', 'shared'])
  const fields = watch('fields')
  const modules = watch('modules')
  const enableMoam = useSelector(getEnableMoam)
  const enableAbsorbanceReader = useSelector(getEnableAbsorbanceReader)
  const robotType = fields.robotType
  const supportedModules =
    robotType === FLEX_ROBOT_TYPE
      ? FLEX_SUPPORTED_MODULE_MODELS
      : OT2_SUPPORTED_MODULE_MODELS

  const filteredSupportedModules = supportedModules.filter(
    moduleModel =>
      !(
        modules != null &&
        Object.values(modules).some(module => module.model === moduleModel)
      )
  )
  const MOAM_MODULE_TYPES: ModuleType[] = enableMoam
    ? [TEMPERATURE_MODULE_TYPE, HEATERSHAKER_MODULE_TYPE, MAGNETIC_BLOCK_TYPE]
    : [TEMPERATURE_MODULE_TYPE]
  console.log(modules)
  return (
    <WizardBody
      stepNumber={robotType === FLEX_ROBOT_TYPE ? 4 : 3}
      header={t('add_modules')}
      disabled={false}
      goBack={() => {
        goBack(1)
        setValue('modules', null)
      }}
      proceed={() => {
        proceed(1)
      }}
    >
      <Flex marginTop={SPACING.spacing60} flexDirection={DIRECTION_COLUMN}>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText
            desktopStyle="headingSmallBold"
            marginBottom={SPACING.spacing12}
          >
            {t('which_mods')}
          </StyledText>
          <Flex gridGap={SPACING.spacing4} flexWrap="wrap">
            {filteredSupportedModules
              .filter(
                module =>
                  module !== ABSORBANCE_READER_V1 && enableAbsorbanceReader
              )
              .map(moduleModel => (
                <EmptySelectorButton
                  key={moduleModel}
                  textAlignment="left"
                  size="small"
                  iconName="plus"
                  text={getModuleDisplayName(moduleModel)}
                  onClick={() => {
                    setValue('modules', {
                      ...modules,
                      [uuid()]: {
                        model: moduleModel,
                        type: getModuleType(moduleModel),
                        slot:
                          robotType === FLEX_ROBOT_TYPE
                            ? DEFAULT_SLOT_MAP_FLEX[moduleModel]
                            : DEFAULT_SLOT_MAP_OT2[getModuleType(moduleModel)],
                      },
                    })
                  }}
                />
              ))}
          </Flex>
          {modules != null && Object.keys(modules).length > 0 ? (
            <Flex
              marginTop={SPACING.spacing32}
              flexDirection={DIRECTION_COLUMN}
            >
              <StyledText
                desktopStyle="headingSmallBold"
                marginBottom={SPACING.spacing12}
              >
                {t('modules_added')}
              </StyledText>
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
                {Object.values(modules).map((module, index) => (
                  <ListItem type="noActive" key={`${module.model}_${index}`}>
                    <ListItemCustomize
                      label={
                        MOAM_MODULE_TYPES.includes(module.type) &&
                        robotType === FLEX_ROBOT_TYPE
                          ? t('quantity')
                          : null
                      }
                      linkText={t('remove')}
                      onClick={() => {
                        const updatedModules =
                          modules != null
                            ? Object.fromEntries(
                                Object.entries(modules).filter(
                                  ([key, value]) => value.type !== module.type
                                )
                              )
                            : {}
                        setValue('modules', updatedModules)
                      }}
                      header={getModuleDisplayName(module.model)}
                      image={
                        <ModuleDiagram
                          type={module.type}
                          model={module.model}
                        />
                      }
                    />
                  </ListItem>
                ))}
              </Flex>
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    </WizardBody>
  )
}
