// @flow
import * as React from 'react'
import styles from './styles.css'

import type { ModuleType } from '@opentrons/shared-data'

type Props = {
  type: ModuleType,
}

const MODULE_IMG_BY_TYPE = {
  magdeck: require('../../images/modules/magdeck.jpg'),
  tempdeck: require('../../images/modules/tempdeck.jpg'),
  thermocycler: require('../../images/modules/thermocycler.jpg'),
}

export function ModuleDiagram(props: Props) {
  return (
    <img
      className={styles.module_diagram}
      src={MODULE_IMG_BY_TYPE[props.type]}
      alt={props.type}
    />
  )
}
