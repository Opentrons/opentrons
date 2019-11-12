// @flow
import * as React from 'react'

import { getModuleDisplayName } from '@opentrons/shared-data'
import { LabeledValue } from '@opentrons/components'
import styles from './styles.css'

import type { Module } from '../../robot-api/types'

type Props = {
  module: Module,
}

export default function ModuleInfo(props: Props) {
  const { name, serial, status, fwVersion } = props.module
  const displayName = getModuleDisplayName(name)
  return (
    <div className={styles.module_info}>
      <div className={styles.grid_50}>
        <LabeledValue label="Name" value={displayName} />
        <LabeledValue label="Serial" value={serial} />
      </div>
      <div className={styles.grid_50}>
        <LabeledValue label="Status" value={status} />
        <LabeledValue label="Firmware Version" value={fwVersion} />
      </div>
    </div>
  )
}
