import { EmptySelectorButton, TYPOGRAPHY } from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import styles from './moduleemptyselectorbuttons.module.css'

import type { ReactNode } from 'react'
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
): ReactNode {
  const { modules, addModule } = props
  return (
    <div className={styles.buttons_container}>
      {modules
        .toSorted((moduleA, moduleB) => moduleA.localeCompare(moduleB))
        .map(moduleModel => (
          <div className={styles.button_container} key={moduleModel}>
            <EmptySelectorButton
              disabled={false}
              textAlignment={TYPOGRAPHY.textAlignLeft}
              iconName="plus"
              text={getModuleDisplayName(moduleModel)}
              onClick={() => {
                addModule(moduleModel)
              }}
            />
          </div>
        ))}
    </div>
  )
}
