import {
  EmptySelectorButton,
  Flex,
  FLEX_MAX_CONTENT,
  SPACING,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import type { ModuleModel } from '@opentrons/shared-data'

interface ModuleEmptSelectorButtonProps {
  modules: ModuleModel[]
  addModule: (moduleModel: ModuleModel) => void
  enableMultipleTempModules: boolean
  numberOfTemps: number
  hasGen1Temp: boolean
}
//  NOTE: This fn is used for selecting modules for the OT-2 only
export function ModuleEmptySelectorButtons(
  props: ModuleEmptSelectorButtonProps
): JSX.Element {
  const { modules, addModule } = props
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
    </Flex>
  )
}
