// @flow
import * as React from 'react'

import { TitledList } from '@opentrons/components'
import { LabwareListItem } from './LabwareListItem'
import { getCalibrationDataForLabware } from '../../calibration/labware/utils'

import type { Labware, Slot, SessionModule } from '../../robot'
import type { BaseProtocolLabware } from '../../calibration/types'

// TODO(bc, 2019-07-31): i18n
const TITLE = 'labware'

type Props = {|
  labware: Array<BaseProtocolLabware>,
  modulesBySlot: { [Slot]: SessionModule },
  tipracksConfirmed: boolean,
  setLabwareToCalibrate: (labware: BaseProtocolLabware) => mixed,
|}

export function LabwareList(props: Props): React.Node {
  const {
    labware,
    tipracksConfirmed,
    setLabwareToCalibrate,
    modulesBySlot,
  } = props
  return (
    <TitledList title={TITLE}>
      {labware.map(lw => (
        <LabwareListItem
          {...lw}
          key={lw.slot}
          isDisabled={!tipracksConfirmed}
          onClick={() => setLabwareToCalibrate(lw)}
        />
      ))}
    </TitledList>
  )
}
