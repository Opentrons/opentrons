// @flow
import * as React from 'react'

import { TitledList } from '@opentrons/components'
import { LabwareListItem } from './LabwareListItem'

import type { Labware, Slot, SessionModule } from '../../robot'
import type { LabwareCalibrationModel } from '../../calibration/types'

// TODO(bc, 2019-07-31): i18n
const TITLE = 'labware'

type Props = {|
  labware: Array<Labware>,
  modulesBySlot: { [Slot]: SessionModule },
  disabled: boolean,
  setLabwareToCalibrate: (labware: Labware) => mixed,
  labwareCalibrations: Array<LabwareCalibrationModel>,
|}

export function LabwareList(props: Props): React.Node {
  const { labware, disabled, setLabwareToCalibrate, modulesBySlot } = props

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
          isDisabled={disabled}
          onClick={() => setLabwareToCalibrate(lw)}
        />
      ))}
    </TitledList>
  )
}
