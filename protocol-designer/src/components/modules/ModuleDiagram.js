// @flow
import * as React from 'react'
import styles from './styles.css'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  type ModuleRealType,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
  type ModuleModel,
} from '@opentrons/shared-data'

type Props = {
  type: ModuleRealType,
  model: ModuleModel,
}

type ModuleImg = {
  [ModuleRealType]: {
    [ModuleModel]: string,
  },
}

const MODULE_IMG_BY_TYPE: ModuleImg = {
  [MAGNETIC_MODULE_TYPE]: {
    [MAGNETIC_MODULE_V1]: require('../../images/modules/magdeck_gen1.png'),
    [MAGNETIC_MODULE_V2]: require('../../images/modules/magdeck_gen2.png'),
  },
  [TEMPERATURE_MODULE_TYPE]: {
    [TEMPERATURE_MODULE_V1]: require('../../images/modules/tempdeck_gen1.png'),
    [TEMPERATURE_MODULE_V2]: require('../../images/modules/tempdeck_gen2.png'),
  },
  [THERMOCYCLER_MODULE_TYPE]: {
    [THERMOCYCLER_MODULE_V1]: require('../../images/modules/thermocycler.jpg'),
  },
}

export function ModuleDiagram(props: Props) {
  // may not always have gen 2
  const model = MODULE_IMG_BY_TYPE[props.type][props.model]
  return <img className={styles.module_diagram} src={model} alt={props.type} />
}
