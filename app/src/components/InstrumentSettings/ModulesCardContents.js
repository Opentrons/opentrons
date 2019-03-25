// @flow
import * as React from 'react'
import type {Module} from '../../http-api-client'
import ModuleItem, {NoModulesMessage} from '../ModuleItem'

type Props = {
  modules: ?Array<Module>,
  showThermo: boolean,
}

export default function ModulesCardContents (props: Props) {
  const {modules, showThermo} = props
  if (!modules || !modules[0] || !showThermo) return <NoModulesMessage />

  return (
    <React.Fragment>
      {modules.map((mod, index) => (
        <ModuleItem module={mod} key={index} />
      ))}
    </React.Fragment>
  )
}
