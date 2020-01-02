// @flow
import * as React from 'react'

import { ModuleImage } from './ModuleImage'
import { ModuleInfo } from './ModuleInfo'
import { ModuleUpdate } from './ModuleUpdate'
import { ModuleControls } from '../ModuleControls'
import styles from './styles.css'
import { THERMOCYCLER, TEMPDECK } from '@opentrons/shared-data/js/constants'
import type { AttachedModule } from '../../modules/types'

type Props = {|
  module: AttachedModule,
  canControl: boolean,
  availableUpdate?: ?string,
|}

export function ModuleItem(props: Props) {
  const { module, canControl } = props

  return (
    <div className={styles.module_item}>
      <div className={styles.module_content}>
        <ModuleImage name={module.name} />
        <ModuleInfo module={module} />
        <ModuleUpdate availableUpdate={props.availableUpdate} />
      </div>
      {(module.name === THERMOCYCLER || module.name === TEMPDECK) && (
        <ModuleControls module={module} canControl={canControl} />
      )}
    </div>
  )
}

export { NoModulesMessage } from './NoModulesMessage'
