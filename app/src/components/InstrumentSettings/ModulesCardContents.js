// @flow
import * as React from 'react'

import type { AttachedModule } from '../../modules/types'
import { ModuleItem, NoModulesMessage } from '../ModuleItem'

type Props = {|
  modules: Array<AttachedModule>,
  controlDisabledReason: string | null,
|}

export function ModulesCardContents(props: Props): React.Node {
  const { modules, controlDisabledReason } = props
  if (modules.length === 0) return <NoModulesMessage />

  return (
    <>
      {modules.map(mod => (
        <ModuleItem
          key={mod.serial}
          module={mod}
          controlDisabledReason={controlDisabledReason}
        />
      ))}
    </>
  )
}
