import * as React from 'react'
import styles from '../../modules/styles.css'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  ModuleType,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
  ModuleModel,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
  GRIPPER_V1,
  GRIPPER_MODULE_TYPE,
} from '@opentrons/shared-data'

interface Props {
  type: ModuleType
  model: ModuleModel
}

export type NewModuleType =
  | typeof MAGNETIC_MODULE_TYPE
  | typeof TEMPERATURE_MODULE_TYPE
  | typeof THERMOCYCLER_MODULE_TYPE
  | typeof HEATERSHAKER_MODULE_TYPE
  | typeof MAGNETIC_BLOCK_TYPE
  | typeof GRIPPER_MODULE_TYPE

type ModuleImg = {
  [type in NewModuleType]: {
    [model in ModuleModel]?: string
  }
}

const MODULE_IMG_BY_TYPE: ModuleImg = {
  [MAGNETIC_MODULE_TYPE]: {
    [MAGNETIC_MODULE_V1]: require('../../../images/modules/magdeck_gen1.png'),
    [MAGNETIC_MODULE_V2]: require('../../../images/modules/magdeck_gen2.png'),
  },
  [TEMPERATURE_MODULE_TYPE]: {
    [TEMPERATURE_MODULE_V1]: require('../../../images/modules/tempdeck_gen1.png'),
    [TEMPERATURE_MODULE_V2]: require('../../../images/modules/tempdeck_gen2.png'),
  },
  [THERMOCYCLER_MODULE_TYPE]: {
    [THERMOCYCLER_MODULE_V1]: require('../../../images/modules/thermocycler.jpg'),
    [THERMOCYCLER_MODULE_V2]: require('../../../images/modules/thermocycler_gen2.png'),
  },
  [HEATERSHAKER_MODULE_TYPE]: {
    [HEATERSHAKER_MODULE_V1]: require('../../../images/modules/heatershaker.png'),
  },
  [MAGNETIC_BLOCK_TYPE]: {
    [MAGNETIC_BLOCK_V1]: require('../../../images/modules/mag_block.png'),
  },
  [GRIPPER_MODULE_TYPE]: {
    [GRIPPER_V1]: require('../../../images/modules/heatershaker.png'), // need to add gripper image here
  },
}

export function FlexSupportedModuleDiagram(props: Props): JSX.Element {
  const model = MODULE_IMG_BY_TYPE[props.type][props.model]
  return <img className={styles.module_diagram} src={model} alt={props.type} />
}
