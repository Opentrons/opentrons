// @flow
import * as React from 'react'

import type {Module} from '../../http-api-client'

import {LabeledValue} from '@opentrons/components'

import styles from './styles.css'

export default function ModuleInfo (props: Module) {
  return (
    <div className={styles.module_info}>
      <div className={styles.grid_50} >
        <LabeledValue label='Name' value={props.displayName} />
        <LabeledValue label='Serial' value={props.serial} />
      </div>
      <div className={styles.grid_50} >
        <LabeledValue label='Status' value={props.status} />
        <LabeledValue label='Firmware Version' value={props.fwVersion} />
      </div>
    </div>
  )
}
