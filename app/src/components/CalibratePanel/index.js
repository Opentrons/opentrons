// @flow
import * as React from 'react'

import { SidePanel } from '@opentrons/components'
import { PipetteList } from './PipetteList'
import { LabwareGroup } from './LabwareGroup'
import styles from './styles.css'

export function CalibratePanel(): React.Node {
  return (
    <SidePanel title="Prepare for Run">
      <div className={styles.setup_panel}>
        <PipetteList />
        <LabwareGroup />
      </div>
    </SidePanel>
  )
}
