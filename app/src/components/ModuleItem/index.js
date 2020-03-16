// @flow
import * as React from 'react'

import { ModuleImage } from './ModuleImage'
import { ModuleInfo } from './ModuleInfo'
import { ModuleUpdate } from './ModuleUpdate'
import { ModuleControls } from '../ModuleControls'
import styles from './styles.css'
import type { AttachedModule } from '../../modules/types'
import { TEMPDECK, THERMOCYCLER } from '../../modules'

type Props = {|
  module: AttachedModule,
  controlDisabledReason: string | null,
  availableUpdate?: ?string,
|}

export function ModuleItem(props: Props) {
  const { module, controlDisabledReason } = props

  return (
    <div className={styles.module_item}>
      <div className={styles.module_content}>
        <ModuleImage name={module.name} />
        <ModuleInfo module={module} />
        <ModuleUpdate
          hasAvailableUpdate={!!module.hasAvailableUpdate}
          controlDisabledReason={controlDisabledReason}
          moduleId={module.serial}
        />
      </div>
      {(module.name === THERMOCYCLER || module.name === TEMPDECK) && (
        <ModuleControls
          module={module}
          controlDisabledReason={controlDisabledReason}
        />
      )}
    </div>
  )
}

export { NoModulesMessage } from './NoModulesMessage'
