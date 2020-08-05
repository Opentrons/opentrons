// @flow
import * as React from 'react'

import { TitledList } from '@opentrons/components'
import { LabwareListItem } from './LabwareListItem'
import { getCalibrationDataForLabware } from '../../calibration/labware/utils'

import type { Labware } from '../../robot'
import type { BaseProtocolLabware } from '../../calibration/types'

// TODO(bc, 2019-07-31): i18n
const TITLE = 'tipracks'

type Props = {|
  tipracks: Array<BaseProtocolLabware>,
  tipracksConfirmed: boolean,
  setLabwareToCalibrate: (labware: BaseProtocolLabware) => mixed,
|}

export function TipRackList(props: Props): React.Node {
  const { tipracks, tipracksConfirmed, setLabwareToCalibrate } = props

  return (
    <TitledList title={TITLE} disabled={tipracksConfirmed}>
      {tipracks.map(tr => (
        <LabwareListItem
          {...tr}
          key={tr.slot}
          isDisabled={tr.confirmed}
          confirmed={tr.confirmed}
          calibrationData={tr.calibration}
          onClick={() => setLabwareToCalibrate(tr)}
        />
      ))}
    </TitledList>
  )
}
