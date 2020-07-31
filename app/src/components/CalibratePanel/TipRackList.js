// @flow
import * as React from 'react'

import { TitledList } from '@opentrons/components'
import { LabwareListItem } from './LabwareListItem'

import type { Labware } from '../../robot'
import type { LabwareCalibrationModel } from '../../calibration/types'

// TODO(bc, 2019-07-31): i18n
const TITLE = 'tipracks'

type Props = {|
  tipracks: Array<Labware>,
  disabled: boolean,
  setLabwareToCalibrate: (labware: Labware) => mixed,
  labwareCalibrations: Array<LabwareCalibrationModel>,
|}

export function TipRackList(props: Props): React.Node {
  const { tipracks, disabled, setLabwareToCalibrate } = props

  return (
    <TitledList title={TITLE} disabled={disabled}>
      {tipracks.map(tr => (
        <LabwareListItem
          {...tr}
          key={tr.slot}
          isDisabled={tr.confirmed}
          confirmed={tr.confirmed}
          onClick={() => setLabwareToCalibrate(tr)}
        />
      ))}
    </TitledList>
  )
}
