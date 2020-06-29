// @flow
import type { ModuleModel } from '@opentrons/shared-data'
import * as React from 'react'

import styles from './styles.css'

type Props = {|
  model: ModuleModel,
|}

export function ModuleImage(props: Props): React.Node {
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
  temperatureModuleV1: require('./images/temperatureModuleV1@3x.png'),
  temperatureModuleV2: require('./images/temperatureModuleV2@3x.png'),
  magneticModuleV1: require('./images/magneticModuleV1@3x.png'),
  magneticModuleV2: require('./images/magneticModuleV2@3x.png'),
  thermocyclerModuleV1: require('./images/thermocyclerModuleV1@3x.png'),
}
