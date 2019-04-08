// @flow
import * as React from 'react'

import type { Module } from '../../http-api-client'
import type { Robot } from '../../discovery'

import ModuleImage from './ModuleImage'
import ModuleInfo from './ModuleInfo'
import ModuleUpdate from './ModuleUpdate'
import NoModulesMessage from './NoModulesMessage'

import ModuleControls from '../ModuleControls'
import styles from './styles.css'

type Props = {
  robot: Robot,
  module: Module,
  availableUpdate?: ?string,
  showControls: boolean,
}

export default function ModuleItem(props: Props) {
  const { module, robot, showControls } = props
  return (
    <div className={styles.module_item}>
      <div className={styles.module_content}>
        <ModuleImage name={module.name} />
        <ModuleInfo module={module} />
        <ModuleUpdate availableUpdate={props.availableUpdate} />
      </div>
      {showControls && <ModuleControls robot={robot} module={module} />}
    </div>
  )
}

export { NoModulesMessage }
