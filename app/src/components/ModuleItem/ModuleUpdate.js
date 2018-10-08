// @flow
import * as React from 'react'

import {OutlineButton} from '@opentrons/components'

import styles from './styles.css'

type Props = {
  availableUpdate?: ?string,
}

export default function ModuleUpdate (props: Props) {
  const {availableUpdate} = props
  const buttonText = availableUpdate
    ? 'update'
    : 'updated'
  return (
    <div className={styles.module_update}>
      <OutlineButton
        disabled={!availableUpdate}
      >
        {buttonText}
      </OutlineButton>
    </div>
  )
}
