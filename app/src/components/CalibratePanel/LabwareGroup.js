// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import partition from 'lodash/partition'

import { SidePanelGroup } from '@opentrons/components'
import { getConnectedRobot } from '../../discovery'
import {
  fetchLabwareCalibrations,
  getLabwareCalibrations,
} from '../../calibration'
import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../robot'
import { getProtocolLabwareList } from '../../calibration/labware'
import { TipRackList } from './TipRackList'
import { LabwareList } from './LabwareList'
import type { BaseProtocolLabware } from '../../calibration/types'
import type { State, Dispatch } from '../../types'

// TODO(bc, 2019-08-03): i18n
const TITLE = 'Labware Calibration'

export function LabwareGroup(): React.Node {
  const dispatch = useDispatch<Dispatch>()

  const calibratorMount = useSelector(robotSelectors.getCalibratorMount)
  const deckPopulated = useSelector(robotSelectors.getDeckPopulated)
  const tipracksConfirmed = useSelector(robotSelectors.getTipracksConfirmed)

  const robot = useSelector(getConnectedRobot)
  const isRunning = useSelector(robotSelectors.getIsRunning)

  const allLabware = useSelector((state: State) => {
    return robot ? getProtocolLabwareList(state, robot.name) : []
  })
  const modulesBySlot = useSelector(robotSelectors.getModulesBySlot)

  React.useEffect(() => {
    robot && dispatch(fetchLabwareCalibrations(robot.name))
  }, [dispatch, robot])

  const [tipracks, otherLabware] = partition(
    allLabware,
    lw => lw.type && lw.isTiprack
  )
  const setLabwareToCalibrate = (lw: BaseProtocolLabware) => {
    const calibrator = lw.calibratorMount || calibratorMount
    if (!!deckPopulated && calibrator) {
      dispatch(robotActions.moveTo(calibrator, lw.slot))
    }
  }

  return (
    <SidePanelGroup title={TITLE} disabled={isRunning}>
      <TipRackList
        tipracks={tipracks}
        setLabwareToCalibrate={setLabwareToCalibrate}
        tipracksConfirmed={tipracksConfirmed}
      />
      <LabwareList
        labware={otherLabware}
        modulesBySlot={modulesBySlot}
        setLabwareToCalibrate={setLabwareToCalibrate}
        tipracksConfirmed={tipracksConfirmed}
      />
    </SidePanelGroup>
  )
}
