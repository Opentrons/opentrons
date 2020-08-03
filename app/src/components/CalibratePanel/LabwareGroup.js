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

export function LabwareGroup(): React.Node {
  const dispatch = useDispatch<Dispatch>()
  const setLabwareToCalibrate = useSetLabwareToCalibrate()
  const robot = useSelector(getConnectedRobot)
  const isRunning = useSelector(robotSelectors.getIsRunning)
  const labwareCalibrations = useSelector((state: State) => {
    return robot ? getLabwareCalibrations(state, robot.name) : []
  })
  const tipracks = useSelector(robotSelectors.getTipracks)
  const tipracksConfirmed = useSelector(robotSelectors.getTipracksConfirmed)

  const otherLabware = useSelector(robotSelectors.getNotTipracks)
  const modulesBySlot = useSelector(robotSelectors.getModulesBySlot)

  React.useEffect(() => {
    robot && dispatch(fetchLabwareCalibrations(robot.name))
  }, [dispatch, robot])
  return (
    <SidePanelGroup title={TITLE} disabled={isRunning}>
      <TipRackList
        tipracks={tipracks}
        setLabwareToCalibrate={setLabwareToCalibrate}
        labwareCalibrations={labwareCalibrations}
        tipracksConfirmed={tipracksConfirmed}
      />
      <LabwareList
        labware={otherLabware}
        modulesBySlot={modulesBySlot}
        setLabwareToCalibrate={setLabwareToCalibrate}
        labwareCalibrations={labwareCalibrations}
        tipracksConfirmed={tipracksConfirmed}
      />
    </SidePanelGroup>
  )
}
