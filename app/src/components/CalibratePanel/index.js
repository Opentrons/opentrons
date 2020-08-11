// @flow
import * as React from 'react'

import { SidePanel } from '@opentrons/components'
import { PipetteList } from './PipetteList'
import { LabwareGroup } from './LabwareGroup'
import styles from './styles.css'

// TODO(bc, 2019-08-03): i18n
const TITLE = 'Prepare for Run'

export function CalibratePanel(): React.Node {
  return (
    <SidePanel title={TITLE}>
      <div className={styles.setup_panel}>
        <PipetteList />
        <LabwareGroup />
      </div>
    </SidePanel>
  )
}
