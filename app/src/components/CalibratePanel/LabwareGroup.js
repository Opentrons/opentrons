// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { SidePanelGroup, TitledList } from '@opentrons/components'
import { fetchLabwareCalibrations } from '../../calibration'
import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../robot'
import { LabwareListItem } from './LabwareListItem'
import type { BaseProtocolLabware } from '../../calibration/types'
import type { Dispatch } from '../../types'

// TODO(bc, 2019-08-03): i18n
const TITLE = 'Labware Calibration'
const TIPRACKS_TITLE = 'tipracks'
const LABWARE_TITLE = 'labware'

export type LabwareGroupProps = {|
  robotName: string | null,
  tipracks: Array<BaseProtocolLabware>,
  otherLabware: Array<BaseProtocolLabware>,
|}

export function LabwareGroup(props: LabwareGroupProps): React.Node {
  const { robotName, tipracks, otherLabware } = props
  const dispatch = useDispatch<Dispatch>()

  const calibratorMount = useSelector(robotSelectors.getCalibratorMount)
  const deckPopulated = useSelector(robotSelectors.getDeckPopulated)
  const tipracksConfirmed = useSelector(robotSelectors.getTipracksConfirmed)

  const isRunning = useSelector(robotSelectors.getIsRunning)

  React.useEffect(() => {
    robotName && dispatch(fetchLabwareCalibrations(robotName))
  }, [dispatch, robotName])

  const setLabwareToCalibrate = (lw: BaseProtocolLabware) => {
    const calibrator = lw.calibratorMount || calibratorMount
    if (!!deckPopulated && calibrator) {
      dispatch(robotActions.moveTo(calibrator, lw.slot))
    }
  }

  return (
    <SidePanelGroup title={TITLE} disabled={isRunning}>
      <TitledList title={TIPRACKS_TITLE} disabled={tipracksConfirmed}>
        {tipracks.map(tr => (
          <LabwareListItem
            {...tr}
            key={tr.slot}
            isDisabled={tr.confirmed}
            onClick={() => setLabwareToCalibrate(tr)}
          />
        ))}
      </TitledList>
      <TitledList title={LABWARE_TITLE}>
        {otherLabware.map(lw => (
          <LabwareListItem
            {...lw}
            key={lw.slot}
            isDisabled={!tipracksConfirmed}
            onClick={() => setLabwareToCalibrate(lw)}
          />
        ))}
      </TitledList>
    </SidePanelGroup>
  )
}
