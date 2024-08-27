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
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import {
  ABSORBANCE_READER_V1,
  FLEX_ROBOT_TYPE,
  getModuleDisplayName,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { uuid } from '../../utils'
import {
  getEnableAbsorbanceReader,
  getEnableMoam,
} from '../../feature-flags/selectors'
import { ModuleDiagram } from '../../components/modules'
import { WizardBody } from './WizardBody'
import {
  DEFAULT_SLOT_MAP_FLEX,
  DEFAULT_SLOT_MAP_OT2,
  FLEX_SUPPORTED_MODULE_MODELS,
  MAX_MAGNETIC_BLOCKS,
  MAX_MOAM_MODULES,
  OT2_SUPPORTED_MODULE_MODELS,
} from './constants'
import { getNumSlotsAvailable } from './utils'

import type { DropdownOption } from '@opentrons/components'
import type { ModuleModel, ModuleType } from '@opentrons/shared-data'
import type { FormModules } from '../../step-forms'
import type { WizardTileProps } from './types'

const getMoamOptions = (length: number): DropdownOption[] => {
  return Array.from({ length }, (_, i) => ({
    name: `${i + 1}`,
    value: `${i + 1}`,
  }))
}

export function SelectModules(props: WizardTileProps): JSX.Element | null {
  const { goBack, proceed, watch, setValue } = props
  const { t } = useTranslation(['create_new_protocol', 'shared'])
  const fields = watch('fields')
  const modules = watch('modules')
  const additionalEquipment = watch('additionalEquipment')
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
        Object.values(modules).some(module =>
          robotType === FLEX_ROBOT_TYPE
            ? module.model === moduleModel
            : module.type === getModuleType(moduleModel)
        )
      )
  )
  const MOAM_MODULE_TYPES: ModuleType[] = enableMoam
    ? [TEMPERATURE_MODULE_TYPE, HEATERSHAKER_MODULE_TYPE, MAGNETIC_BLOCK_TYPE]
    : [TEMPERATURE_MODULE_TYPE]

  let isDisabled = getNumSlotsAvailable(modules, additionalEquipment) === 0
  //  special-casing TC since it takes up 2 slots
  if (
    modules != null &&
    Object.values(modules).some(
      module => module.type === THERMOCYCLER_MODULE_TYPE
    )
  ) {
    isDisabled = getNumSlotsAvailable(modules, additionalEquipment) <= 1
  }

  const filteredModules: FormModules = {}
  const seenModels = new Set<ModuleModel>()

  if (modules != null) {
    Object.entries(modules).forEach(([key, mod]) => {
      if (!seenModels.has(mod.model)) {
        seenModels.add(mod.model)
        filteredModules[parseInt(key)] = mod
      }
    })
  }

  return (
    <WizardBody
      stepNumber={robotType === FLEX_ROBOT_TYPE ? 4 : 3}
      header={t('add_modules')}
      disabled={isDisabled}
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
          <Flex gridGap={SPACING.spacing4} flexWrap={WRAP}>
            {filteredSupportedModules
              .filter(module =>
                enableAbsorbanceReader
                  ? module
                  : module !== ABSORBANCE_READER_V1
              )
              .map(moduleModel => (
                <EmptySelectorButton
                  key={moduleModel}
                  textAlignment={TYPOGRAPHY.textAlignLeft}
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
          {modules != null &&
          Object.keys(modules).length > 0 &&
          Object.keys(filteredModules).length > 0 ? (
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
                {Object.values(filteredModules).map((module, index) => {
                  const length = Object.values(modules).filter(
                    mod => module.type === mod.type
                  ).length

                  const dropdownProps = {
                    currentOption: { name: `${length}`, value: `${length}` },
                    onClick: (value: string) => {
                      const num = parseInt(value)
                      const moamModules =
                        modules != null
                          ? Object.entries(modules).filter(
                              ([key, mod]) => mod.type === module.type
                            )
                          : []

                      if (num > moamModules.length) {
                        const newModules = { ...modules }
                        for (let i = 0; i < num - moamModules.length; i++) {
                          //  @ts-expect-error: TS can't determine modules's type correctly
                          newModules[uuid()] = {
                            model: module.model,
                            type: module.type,
                            slot: null,
                          }
                        }
                        setValue('modules', newModules)
                      } else if (num < moamModules.length) {
                        const modulesToRemove = moamModules.length - num
                        const remainingModules: FormModules = {}

                        Object.entries(modules).forEach(([key, mod]) => {
                          const shouldRemove = moamModules
                            .slice(-modulesToRemove)
                            .some(([removeKey]) => removeKey === key)
                          if (!shouldRemove) {
                            remainingModules[parseInt(key)] = mod
                          }
                        })

                        setValue('modules', remainingModules)
                      }
                    },
                    dropdownType: 'neutral' as any,
                    filterOptions: getMoamOptions(
                      module.type === MAGNETIC_BLOCK_TYPE
                        ? MAX_MAGNETIC_BLOCKS
                        : MAX_MOAM_MODULES
                    ),
                  }
                  return (
                    <ListItem type="noActive" key={`${module.model}_${index}`}>
                      <ListItemCustomize
                        dropdown={
                          MOAM_MODULE_TYPES.includes(module.type) &&
                          robotType === FLEX_ROBOT_TYPE
                            ? dropdownProps
                            : undefined
                        }
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
                        leftHeaderItem={
                          <ModuleDiagram
                            type={module.type}
                            model={module.model}
                          />
                        }
                      />
                    </ListItem>
                  )
                })}
              </Flex>
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    </WizardBody>
  )
}
