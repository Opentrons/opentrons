import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
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
  MAGNETIC_BLOCK_V1,
  TEMPERATURE_MODULE_TYPE,
} from '@opentrons/shared-data'
import { uuid } from '../../utils'
import {
  getEnableAbsorbanceReader,
  getEnableMoam,
} from '../../feature-flags/selectors'
import { useKitchen } from '../../organisms/Kitchen/hooks'
import { ModuleDiagram } from '../../components/modules'
import { WizardBody } from './WizardBody'
import {
  DEFAULT_SLOT_MAP_FLEX,
  DEFAULT_SLOT_MAP_OT2,
  FLEX_SUPPORTED_MODULE_MODELS,
  OT2_SUPPORTED_MODULE_MODELS,
} from './constants'
import { getNumOptions, getNumSlotsAvailable } from './utils'
import { HandleEnter } from './HandleEnter'

import type { DropdownBorder } from '@opentrons/components'
import type { ModuleModel, ModuleType } from '@opentrons/shared-data'
import type { FormModules } from '../../step-forms'
import type { WizardTileProps } from './types'

export function SelectModules(props: WizardTileProps): JSX.Element | null {
  const { goBack, proceed, watch, setValue } = props
  const { t } = useTranslation(['create_new_protocol', 'shared'])
  const { makeSnackbar } = useKitchen()
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

  const numSlotsAvailable = getNumSlotsAvailable(modules, additionalEquipment)
  const hasNoAvailableSlots = numSlotsAvailable === 0
  const numMagneticBlocks =
    modules != null
      ? Object.values(modules).filter(
          module => module.model === MAGNETIC_BLOCK_V1
        )?.length
      : 0
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
    <HandleEnter onEnter={proceed}>
      <WizardBody
        stepNumber={robotType === FLEX_ROBOT_TYPE ? 4 : 3}
        header={t('add_modules')}
        goBack={() => {
          goBack(1)
          setValue('modules', null)
        }}
        proceed={() => {
          proceed(1)
        }}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
            {filteredSupportedModules.length > 0 ? (
              <StyledText desktopStyle="headingSmallBold">
                {t('which_mods')}
              </StyledText>
            ) : null}
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
                    disabled={
                      (moduleModel !== 'magneticBlockV1' &&
                        hasNoAvailableSlots) ||
                      (moduleModel === 'thermocyclerModuleV2' &&
                        numSlotsAvailable <= 1) ||
                      (moduleModel === 'magneticBlockV1' &&
                        hasNoAvailableSlots &&
                        numMagneticBlocks === 4)
                    }
                    textAlignment={TYPOGRAPHY.textAlignLeft}
                    size="small"
                    iconName="plus"
                    text={getModuleDisplayName(moduleModel)}
                    onClick={() => {
                      if (hasNoAvailableSlots) {
                        makeSnackbar(t('slots_limit_reached') as string)
                      } else {
                        setValue('modules', {
                          ...modules,
                          [uuid()]: {
                            model: moduleModel,
                            type: getModuleType(moduleModel),
                            slot:
                              robotType === FLEX_ROBOT_TYPE
                                ? DEFAULT_SLOT_MAP_FLEX[moduleModel]
                                : DEFAULT_SLOT_MAP_OT2[
                                    getModuleType(moduleModel)
                                  ],
                          },
                        })
                      }
                    }}
                  />
                ))}
            </Flex>
            {modules != null &&
            Object.keys(modules).length > 0 &&
            Object.keys(filteredModules).length > 0 ? (
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing12}
                paddingTop={SPACING.spacing32}
              >
                <StyledText desktopStyle="headingSmallBold">
                  {t('modules_added')}
                </StyledText>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing4}
                >
                  {Object.values(filteredModules).map((module, index) => {
                    const length = Object.values(modules).filter(
                      mod => module.type === mod.type
                    ).length

                    const dropdownProps = {
                      currentOption: {
                        name: `${length}`,
                        value: `${length}`,
                      },
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
                      dropdownType: 'neutral' as DropdownBorder,
                      filterOptions: getNumOptions(
                        module.model === 'magneticBlockV1'
                          ? numSlotsAvailable + 3 + length
                          : numSlotsAvailable + length
                      ),
                    }
                    return (
                      <ListItem
                        type="noActive"
                        key={`${module.model}_${index}`}
                      >
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
                                      ([key, value]) =>
                                        value.type !== module.type
                                    )
                                  )
                                : {}
                            setValue('modules', updatedModules)
                          }}
                          header={getModuleDisplayName(module.model)}
                          leftHeaderItem={
                            <Flex
                              backgroundColor={COLORS.white}
                              borderRadius={BORDERS.borderRadius8}
                              alignItems={ALIGN_CENTER}
                              width="3.75rem"
                            >
                              <ModuleDiagram
                                type={module.type}
                                model={module.model}
                              />
                            </Flex>
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
    </HandleEnter>
  )
}
