// @flow
import * as React from 'react'
import type {Module} from '../../http-api-client'
import ModuleItem, {NoModulesMessage} from '../ModuleItem'

type Props = {
  modules: Array<Module>,
}

export default function ModulesCardContents (props: Props) {
  const modulesFound = props.modules[0]
  if (modulesFound) {
    return (
      <React.Fragment>
      {props.modules.map((mod) => (
        <ModuleItem {...mod} />
      ))}
      </React.Fragment>
    )
  }
  return (<NoModulesMessage />)
}
