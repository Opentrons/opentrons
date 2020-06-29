// @flow
import { SidePanelGroup } from '@opentrons/components'
import * as React from 'react'
import { useSelector } from 'react-redux'

import { selectors as robotSelectors } from '../../robot'

const TITLE = 'Labware Calibration'

export type LabwareGroupProps = {| children: React.Node |}

export function LabwareGroup(props: LabwareGroupProps): React.Node {
  const isRunning = useSelector(robotSelectors.getIsRunning)

  return (
    <SidePanelGroup title={TITLE} disabled={isRunning}>
      {props.children}
    </SidePanelGroup>
  )
}
