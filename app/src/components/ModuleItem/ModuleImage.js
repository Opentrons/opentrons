// @flow
import * as React from 'react'

import styles from './styles.css'

import type { ModuleModel } from '@opentrons/shared-data'

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
  temperatureModuleV1: require('../../assets/images/modules/temperatureModuleV1@3x.png'),
  temperatureModuleV2: require('../../assets/images/modules/temperatureModuleV2@3x.png'),
  magneticModuleV1: require('../../assets/images/modules/magneticModuleV1@3x.png'),
  magneticModuleV2: require('../../assets/images/modules/magneticModuleV2@3x.png'),
  thermocyclerModuleV1: require('../../assets/images/modules/thermocyclerModuleV1@3x.png'),
}
