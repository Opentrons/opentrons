import * as React from 'react'
import { SidePanel } from '@opentrons/components'

import { RunTimeControl } from '../../../organisms/RunTimeControl'

export function RunPanel(): JSX.Element {
  return (
    <SidePanel>
      <RunTimeControl />
    </SidePanel>
  )
}
