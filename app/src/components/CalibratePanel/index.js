// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import partition from 'lodash/partition'

import type { State } from '../../redux/types'

import { SidePanel } from '@opentrons/components'
import { selectors as robotSelectors } from '../../redux/robot'
import { getProtocolLabwareList } from '../../redux/calibration/labware'
import { PipetteList } from './PipetteList'
import { LabwareGroup } from './LabwareGroup'
import styles from './styles.css'

// TODO(bc, 2019-08-03): i18n
const TITLE = 'Prepare for Run'

export function CalibratePanel(): React.Node {
  const robotName = useSelector(robotSelectors.getConnectedRobotName)

  const allLabware = useSelector((state: State) => {
    return robotName ? getProtocolLabwareList(state, robotName) : []
  })

  const [tipracks, otherLabware] = partition(
    allLabware,
    lw => lw.type && lw.isTiprack
  )

  return (
    <SidePanel title={TITLE}>
      <div className={styles.setup_panel}>
        <PipetteList robotName={robotName} tipracks={tipracks} />
        <LabwareGroup
          robotName={robotName}
          tipracks={tipracks}
          otherLabware={otherLabware}
        />
      </div>
    </SidePanel>
  )
}
