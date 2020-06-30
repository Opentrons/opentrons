// @flow
import * as React from 'react'

import { getModuleDisplayName } from '@opentrons/shared-data'
import { LabeledValue } from '@opentrons/components'
import type { AttachedModule } from '../../modules/types'
import styles from './styles.css'

type Props = {|
  module: AttachedModule,
|}

export function ModuleInfo(props: Props): React.Node {
  const { model, serial, status, fwVersion } = props.module
  const displayName = getModuleDisplayName(model)

  return (
    <div className={styles.module_info}>
      <div className={styles.grid_50}>
        <LabeledValue label="Name" value={displayName} />
        <LabeledValue label="Serial" value={serial} />
      </div>
      <div className={styles.grid_50}>
        <LabeledValue label="Status" value={status} />
        <LabeledValue label="Firmware Version" value={fwVersion} />
      </div>
    </div>
  )
}
