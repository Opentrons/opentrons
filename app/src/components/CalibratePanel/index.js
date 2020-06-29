// @flow
import { SidePanel } from '@opentrons/components'
import * as React from 'react'

import { LabwareGroup } from './LabwareGroup'
import { LabwareList } from './LabwareList'
import { PipetteList } from './PipetteList'
import styles from './styles.css'
import { TipRackList } from './TipRackList'

export function CalibratePanel(): React.Node {
  return (
    <SidePanel title="Prepare for Run">
      <div className={styles.setup_panel}>
        <PipetteList />
        <LabwareGroup>
          <TipRackList />
          <LabwareList />
        </LabwareGroup>
      </div>
    </SidePanel>
  )
}
