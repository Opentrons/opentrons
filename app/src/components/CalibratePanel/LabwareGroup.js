// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { SidePanelGroup } from '@opentrons/components'
import { getConnectedRobot } from '../../discovery'
import {
  fetchLabwareCalibrations,
  getLabwareCalibrations,
} from '../../calibration'
import { selectors as robotSelectors } from '../../robot'
import { TipRackList } from './TipRackList'
import { LabwareList } from './LabwareList'
import { useSetLabwareToCalibrate } from './hooks'
import type { State, Dispatch } from '../../types'

const TITLE = 'Labware Calibration'

export type LabwareGroupProps = {| children: React.Node |}

export function LabwareGroup(props: LabwareGroupProps): React.Node {
  const dispatch = useDispatch<Dispatch>()
  const setLabwareToCalibrate = useSetLabwareToCalibrate()
  const robot = useSelector(getConnectedRobot)
  const isRunning = useSelector(robotSelectors.getIsRunning)
  const labwareCalibrations = useSelector((state: State) => {
    return robot ? getLabwareCalibrations(state, robot.name) : []
  })
  const tipracksConfirmed = useSelector(robotSelectors.getTipracksConfirmed)

  const tipracks = useSelector(robotSelectors.getTipracks)
  const otherLabware = useSelector(robotSelectors.getNotTipracks)
  const modulesBySlot = useSelector(robotSelectors.getModulesBySlot)

  React.useEffect(() => {
    robot && dispatch(fetchLabwareCalibrations(robot.name))
  }, [dispatch, robot])
  console.log('ALLCAL', labwareCalibrations)
  return (
    <SidePanelGroup title={TITLE} disabled={isRunning}>
      <TipRackList
        tipracks={tipracks}
        setLabwareToCalibrate={setLabwareToCalibrate}
        labwareCalibrations={labwareCalibrations}
        disabled={tipracksConfirmed}
      />
      <LabwareList
        labware={otherLabware}
        modulesBySlot={modulesBySlot}
        setLabwareToCalibrate={setLabwareToCalibrate}
        labwareCalibrations={labwareCalibrations}
        disabled={!tipracksConfirmed}
      />
    </SidePanelGroup>
  )
}
