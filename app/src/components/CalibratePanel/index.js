// @flow
import * as React from 'react'

import { SidePanel } from '@opentrons/components'
import { PipetteList } from './PipetteList'
import { LabwareGroup } from './LabwareGroup'
import { TipRackList } from './TipRackList'
import { LabwareList } from './LabwareList'
import styles from './styles.css'

export function CalibratePanel() {
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
