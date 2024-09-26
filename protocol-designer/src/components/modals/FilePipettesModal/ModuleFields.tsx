import { Flex, SPACING, WRAP, ALIGN_CENTER } from '@opentrons/components'
import {
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  OT2_ROBOT_TYPE,
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
import { uuid } from '../../../utils'
import { ModuleDiagram } from '../../modules'
import { EquipmentOption } from '../CreateFileWizard/EquipmentOption'
import type { ModuleModel, ModuleType } from '@opentrons/shared-data'
import type { WizardTileProps } from '../CreateFileWizard/types'

export const DEFAULT_SLOT_MAP: { [moduleType in ModuleType]?: string } = {
  [THERMOCYCLER_MODULE_TYPE]: SPAN7_8_10_11_SLOT,
  [HEATERSHAKER_MODULE_TYPE]: '1',
  [MAGNETIC_MODULE_TYPE]: '1',
  [TEMPERATURE_MODULE_TYPE]: '3',
}
export const OT2_SUPPORTED_MODULE_MODELS: ModuleModel[] = [
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
]

export function ModuleFields(props: WizardTileProps): JSX.Element {
  const { watch, setValue } = props
  const modules = watch('modules')
  const moduleModelsOnDeck =
    modules != null ? Object.values(modules).map(module => module.model) : []
  const moduleTypesOnDeck =
    modules != null ? Object.values(modules).map(module => module.type) : []
  return (
    <Flex flexWrap={WRAP} gridGap={SPACING.spacing4} alignSelf={ALIGN_CENTER}>
      {OT2_SUPPORTED_MODULE_MODELS.map(moduleModel => {
        const moduleType = getModuleType(moduleModel)
        const moduleOnDeck = moduleModelsOnDeck.includes(moduleModel)
        return (
          <EquipmentOption
            robotType={OT2_ROBOT_TYPE}
            key={moduleModel}
            isSelected={moduleOnDeck}
            image={<ModuleDiagram type={moduleType} model={moduleModel} />}
            text={getModuleDisplayName(moduleModel)}
            disabled={moduleTypesOnDeck.includes(moduleType) && !moduleOnDeck}
            onClick={() => {
              if (moduleOnDeck) {
                const updatedModulesByModel =
                  modules != null
                    ? Object.fromEntries(
                        Object.entries(modules).filter(
                          ([key, value]) => value.model !== moduleModel
                        )
                      )
                    : {}
                setValue('modules', updatedModulesByModel)
              } else {
                setValue('modules', {
                  ...modules,
                  [uuid()]: {
                    model: moduleModel,
                    type: moduleType,
                    slot: DEFAULT_SLOT_MAP[moduleType] ?? '',
                  },
                })
              }
            }}
            showCheckbox
          />
        )
      })}
    </Flex>
  )
}
