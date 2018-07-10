// @flow
import * as React from 'react'

import type {Module} from '../../http-api-client'

import ModuleImage from './ModuleImage'
import ModuleInfo from './ModuleInfo'
import ModuleUpdate from './ModuleUpdate'
import NoModulesMessage from './NoModulesMessage'

import styles from './styles.css'

export default function ModuleItem (props: Module) {
  return (
    <div className={styles.module_item}>
      <ModuleImage {...props}/>
      <ModuleInfo {...props}/>
      <ModuleUpdate {...props}/>
    </div>
  )
}

export {NoModulesMessage}
