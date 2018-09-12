// @flow
import * as React from 'react'

import styles from './styles.css'

type Props = {
  name: string,
}

export default function ModuleImage (props: Props) {
  const imgSrc = getModuleImg(props.name)
  return (
    <div className={styles.module_image_wrapper}>
      <img src={imgSrc} className={styles.module_image}/>
    </div>
  )
}

function getModuleImg (name: string) {
  return MODULE_IMGS[name]
}

const MODULE_IMGS = {
  tempdeck: require('./images/module-temp@3x.png'),
  magdeck: require('./images/module-mag@3x.png'),
}
