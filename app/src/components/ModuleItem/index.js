// @flow
import * as React from 'react'

import type {Module} from '../../http-api-client'

import ModuleImage from './ModuleImage'
import ModuleInfo from './ModuleInfo'
import ModuleUpdate from './ModuleUpdate'
import NoModulesMessage from './NoModulesMessage'

import styles from './styles.css'

type Props = {
  module: Module,
  availableUpdate?: ?string,
}

export default function ModuleItem (props: Props) {
  const {module} = props
  return (
    <div className={styles.module_item}>
      <ModuleImage name={module.name}/>
      <ModuleInfo module={module}/>
      <ModuleUpdate availableUpdate={props.availableUpdate}/>
    </div>
  )
}

export {NoModulesMessage}
