// @flow
import * as React from 'react'
import head from 'lodash/head'

import { TitledList } from '@opentrons/components'
import { LabwareListItem } from './LabwareListItem'
import { getCalibrationDataForLabware } from '../../calibration/labware/utils'

import type { Labware, Slot, SessionModule } from '../../robot'
import type { LabwareCalibrationModel } from '../../calibration/types'

// TODO(bc, 2019-07-31): i18n
const TITLE = 'labware'

type Props = {|
  labware: Array<Labware>,
  modulesBySlot: { [Slot]: SessionModule },
  tipracksConfirmed: boolean,
  setLabwareToCalibrate: (labware: Labware) => mixed,
  labwareCalibrations: Array<LabwareCalibrationModel>,
|}

export function LabwareList(props: Props): React.Node {
  const {
    labware,
    tipracksConfirmed,
    setLabwareToCalibrate,
    modulesBySlot,
    labwareCalibrations,
  } = props
  return (
    <TitledList title={TITLE}>
      {labware.map(lw => (
        <LabwareListItem
          {...lw}
          key={lw.slot}
          moduleModel={
            modulesBySlot &&
            modulesBySlot[lw.slot] &&
            modulesBySlot[lw.slot].model
          }
          calibrationData={
            head(
              getCalibrationDataForLabware(
                labwareCalibrations,
                lw,
                modulesBySlot
              )
            ) ?? null
          }
          isDisabled={!tipracksConfirmed}
          onClick={() => setLabwareToCalibrate(lw)}
        />
      ))}
    </TitledList>
  )
}
