// @flow
import * as React from 'react'

import styles from './styles.css'

import type { ModuleModel } from '@opentrons/shared-data'

type Props = {|
  model: ModuleModel,
|}

export function ModuleImage(props: Props) {
  const imgSrc = getModuleImg(props.model)

  return (
    <div className={styles.module_image_wrapper}>
      <img src={imgSrc} className={styles.module_image} />
    </div>
  )
}

function getModuleImg(model: ModuleModel) {
  return MODULE_IMGS[model]
}

const MODULE_IMGS: { [ModuleModel]: mixed } = {
  temperatureModuleV1: require('./images/module-temp@3x.png'),
  temperatureModuleV2: require('./images/module-temp@3x.png'),
  magneticModuleV1: require('./images/module-mag@3x.png'),
  magneticModuleV2: require('./images/module-mag@3x.png'),
  thermocyclerModuleV1: require('./images/module-thermo@3x.png'),
}
