// @flow
import * as React from 'react'

import type {Module} from '../../http-api-client'

import {LabeledValue} from '@opentrons/components'

import styles from './styles.css'

type Props = {
  module: Module,
}

export default function ModuleInfo (props: Props) {
  const {displayName, serial, status, fwVersion} = props.module
  return (
    <div className={styles.module_info}>
      <div className={styles.grid_50} >
        <LabeledValue label='Name' value={displayName} />
        <LabeledValue label='Serial' value={serial} />
      </div>
      <div className={styles.grid_50} >
        <LabeledValue label='Status' value={status} />
        <LabeledValue label='Firmware Version' value={fwVersion} />
      </div>
    </div>
  )
}
