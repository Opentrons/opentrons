// @flow
import * as React from 'react'

import { ModuleControls } from '../ModuleControls'
import type { AttachedModule } from '../../modules/types'
import {
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '../../modules'
import { ModuleImage } from './ModuleImage'
import { ModuleInfo } from './ModuleInfo'
import { ModuleUpdate } from './ModuleUpdate'
import styles from './styles.css'

type Props = {|
  module: AttachedModule,
  controlDisabledReason: string | null,
  availableUpdate?: ?string,
|}

export function ModuleItem(props: Props): React.Node {
  const { module, controlDisabledReason } = props

  return (
    <div className={styles.module_item}>
      <div className={styles.module_content}>
        <ModuleImage model={module.model} />
        <ModuleInfo module={module} />
        <ModuleUpdate
          hasAvailableUpdate={!!module.hasAvailableUpdate}
          controlDisabledReason={controlDisabledReason}
          moduleId={module.serial}
        />
      </div>
      {(module.type === THERMOCYCLER_MODULE_TYPE ||
        module.type === TEMPERATURE_MODULE_TYPE) && (
        <ModuleControls
          module={module}
          controlDisabledReason={controlDisabledReason}
        />
      )}
    </div>
  )
}

export { NoModulesMessage } from './NoModulesMessage'
