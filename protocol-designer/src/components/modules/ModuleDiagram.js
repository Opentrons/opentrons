// @flow
import * as React from 'react'
import styles from './styles.css'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  type ModuleRealType,
} from '@opentrons/shared-data'

type Props = {
  type: ModuleRealType,
}

const MODULE_IMG_BY_TYPE: { [ModuleRealType]: string } = {
  [MAGNETIC_MODULE_TYPE]: require('../../images/modules/magdeck.jpg'),
  [TEMPERATURE_MODULE_TYPE]: require('../../images/modules/tempdeck.jpg'),
  [THERMOCYCLER_MODULE_TYPE]: require('../../images/modules/thermocycler.jpg'),
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
