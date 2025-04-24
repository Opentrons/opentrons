import {
  EmptySelectorButton,
  Flex,
  FLEX_MAX_CONTENT,
  SPACING,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  TEMPERATURE_MODULE_V2,
} from '@opentrons/shared-data'

import type { ModuleModel } from '@opentrons/shared-data'

interface ModuleEmptSelectorButtonProps {
  modules: ModuleModel[]
  addModule: (moduleModel: ModuleModel) => void
  // used for enabling 2 temperature modules
  enableMultipleTempModules: boolean
  // used for enabling 2 temperature modules
  numberOfTemps: number
  // used for enabling 2 temperature modules
  hasGen1Temp: boolean
}
//  NOTE: This fn is used for selecting modules for the OT-2 only
export function ModuleEmptySelectorButtons(
  props: ModuleEmptSelectorButtonProps
): JSX.Element {
  const {
    modules,
    addModule,
    enableMultipleTempModules,
    numberOfTemps,
    hasGen1Temp,
  } = props
  return (
    <Flex gridGap={SPACING.spacing4} flexWrap={WRAP}>
      {modules
        .sort((moduleA, moduleB) => moduleA.localeCompare(moduleB))
        .map(moduleModel => (
          <Flex width={FLEX_MAX_CONTENT} key={moduleModel}>
            <EmptySelectorButton
              disabled={false}
              textAlignment={TYPOGRAPHY.textAlignLeft}
              iconName="plus"
              text={getModuleDisplayName(moduleModel)}
              onClick={() => {
                addModule(moduleModel)
              }}
            />
          </Flex>
        ))}
      {/* add an option for a 2nd temperature module v2 if the userFacing flag is turned on */}
      {enableMultipleTempModules && numberOfTemps < 2 && !hasGen1Temp ? (
        <Flex width={FLEX_MAX_CONTENT} key={`${TEMPERATURE_MODULE_V2}_2`}>
          <EmptySelectorButton
            disabled={false}
            textAlignment={TYPOGRAPHY.textAlignLeft}
            iconName="plus"
            text={getModuleDisplayName(TEMPERATURE_MODULE_V2)}
            onClick={() => {
              addModule(TEMPERATURE_MODULE_V2)
            }}
          />
        </Flex>
      ) : null}
    </Flex>
  )
}
