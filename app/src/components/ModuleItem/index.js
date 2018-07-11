// @flow
import * as React from 'react'

import type {Module} from '../../http-api-client'

import ModuleImage from './ModuleImage'
import ModuleInfo from './ModuleInfo'
import ModuleUpdate from './ModuleUpdate'
import NoModulesMessage from './NoModulesMessage'

import styles from './styles.css'

type Props = Module & {
  availableUpdate?: ?string
}

export default function ModuleItem (props: Props) {
  return (
    <div className={styles.module_item}>
      <ModuleImage name={props.name}/>
      <ModuleInfo {...props}/>
      <ModuleUpdate availableUpdate={props.availableUpdate}/>
    </div>
  )
}

export {NoModulesMessage}
