// @flow
import * as React from 'react'

import styles from './styles.css'

type Props = {
  displayName: string
}

export default function ModuleImage (props: Props) {
  const imgSrc = getModuleImg(props.displayName)
  return (
    <div className={styles.module_image}>
      <img src={imgSrc} />
    </div>
  )
}

function getModuleImg (name: string) {
  return MODULE_IMGS[name]
}

// TODO (ka 2018-7-10): replace with design assets onces available
const MODULE_IMGS = {
  'Temperature Module': 'http://via.placeholder.com/100x75',
  'Magnetic Bead Module': 'http://via.placeholder.com/100x75'
}
