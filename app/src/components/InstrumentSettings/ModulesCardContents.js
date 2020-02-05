// @flow
import * as React from 'react'

import { ModuleItem, NoModulesMessage } from '../ModuleItem'

import type { AttachedModule } from '../../modules/types'

type Props = {|
  modules: Array<AttachedModule>,
  canControl: boolean,
|}

export function ModulesCardContents(props: Props) {
  const { modules, canControl } = props
  if (modules.length === 0) return <NoModulesMessage />

  return (
    <>
      {modules.map(mod => (
        <ModuleItem key={mod.serial} module={mod} canControl={canControl} />
      ))}
    </>
  )
}
