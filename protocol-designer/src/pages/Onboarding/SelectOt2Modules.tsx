import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  ListItem,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  getModuleType,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import { HandleEnter } from '../../components/atoms'
import { ModuleEmptySelectorButtons } from '../../components/organisms'
import { uuid } from '../../utils'
import { DEFAULT_SLOT_MAP_OT2, OT2_SUPPORTED_MODULE_MODELS } from './constants'
import { ModuleDiagram } from './ModuleDiagram'
import { PDListItemCustomize as ListItemCustomize } from './PDListItemCustomize'
import { WizardBody } from './WizardBody'

import type { ModuleModel, ModuleType } from '@opentrons/shared-data'
import type { FormModule } from '../../step-forms'
import type { OT2ModuleType } from '../../types'
import type { WizardTileProps } from './types'

export function SelectOt2Modules(props: WizardTileProps): JSX.Element | null {
  const { goBack, proceed, watch, setValue } = props
  const { t } = useTranslation(['onboarding', 'shared'])
  const modules = watch('modules')
  const supportedModules = OT2_SUPPORTED_MODULE_MODELS
  const filteredSupportedModules = supportedModules.filter(
    moduleModel =>
      !Object.values(modules).some(
        module => module.type === getModuleType(moduleModel)
      )
  )

  const handleAddModule = (moduleModel: ModuleModel): void => {
    setValue('modules', {
      ...modules,
      [uuid()]: {
        model: moduleModel,
        type: getModuleType(moduleModel),
        slot: DEFAULT_SLOT_MAP_OT2[getModuleType(moduleModel)],
      },
    })
  }

  const handleRemoveModule = (moduleType: ModuleType): void => {
    const updatedModules = Object.fromEntries(
      Object.entries(modules).filter(
        ([key, value]) => value.type !== moduleType
      )
    )
    setValue('modules', updatedModules)
  }

  return (
    <HandleEnter onEnter={proceed}>
      <WizardBody
        robotType={OT2_ROBOT_TYPE}
        stepNumber={2}
        subStepNumber={4}
        header={t('add_modules')}
        goBack={() => {
          goBack(1)
        }}
        proceed={() => {
          proceed(1)
        }}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
            {filteredSupportedModules.length > 0 ? (
              <StyledText desktopStyle="headingSmallBold">
                {t('which_modules')}
              </StyledText>
            ) : null}
            <ModuleEmptySelectorButtons
              modules={filteredSupportedModules}
              addModule={handleAddModule}
              enableMultipleTempModules={false}
              numberOfTemps={0}
              hasGen1Temp={false}
            />
            {Object.keys(modules).length > 0 ? (
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
                  {Object.entries(modules)
                    .sort(([, moduleA], [, moduleB]) =>
                      moduleA.model.localeCompare(moduleB.model)
                    )
                    .reduce<Array<FormModule & { key: string }>>(
                      (acc, [key, module]) => {
                        acc.push({ ...module, key })
                        return acc
                      },
                      []
                    )
                    .map(module => (
                      <ListItem type="default" key={module.model}>
                        <ListItemCustomize
                          linkText={t('remove')}
                          onClick={() => {
                            handleRemoveModule(module.type)
                          }}
                          header={getModuleDisplayName(module.model)}
                          leftHeaderItem={
                            <Flex
                              padding={SPACING.spacing2}
                              backgroundColor={COLORS.white}
                              borderRadius={BORDERS.borderRadius8}
                              alignItems={ALIGN_CENTER}
                              width="3.75rem"
                              height="3.625rem"
                            >
                              <ModuleDiagram
                                type={module.type as OT2ModuleType}
                                model={module.model}
                              />
                            </Flex>
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
    </HandleEnter>
  )
}
