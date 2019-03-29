// @flow
import * as React from 'react'
import type {Module} from '../../http-api-client'
import ModuleItem, {NoModulesMessage} from '../ModuleItem'

import filter from 'lodash/filter'

type Props = {
  modules: ?Array<Module>,
  showThermo: boolean,
}

export default function ModulesCardContents (props: Props) {
  const {showThermo} = props
  const modules = filter(props.modules, m => {
    return showThermo || m.name !== 'thermocycler'
  })

  if (modules.length === 0) return <NoModulesMessage />

  return (
    <React.Fragment>
      {modules.map((mod, index) => (
        <ModuleItem module={mod} key={index} />
      ))}
    </React.Fragment>
  )
}
