import * as React from 'react'
import { SidePanel } from '@opentrons/components'

import { RunTimeControl } from '../../../organisms/RunTimeControl'
import { ModuleLiveStatusCards } from './ModuleLiveStatusCards'

export function RunPanel(): JSX.Element {
  return (
    <SidePanel>
      <RunTimeControl />
      <ModuleLiveStatusCards />
    </SidePanel>
  )
}
