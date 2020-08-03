// @flow
import * as React from 'react'
import head from 'lodash/head'

import { TitledList } from '@opentrons/components'
import { LabwareListItem } from './LabwareListItem'
import { getCalibrationDataForLabware } from '../../calibration/labware/utils'

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
  const {
    tipracks,
    disabled,
    setLabwareToCalibrate,
    labwareCalibrations,
  } = props

  return (
    <TitledList title={TITLE} disabled={disabled}>
      {tipracks.map(tr => (
        <LabwareListItem
          {...tr}
          key={tr.slot}
          isDisabled={tr.confirmed}
          confirmed={tr.confirmed}
          calibrationData={
            head(getCalibrationDataForLabware(labwareCalibrations, tr)) ?? null
          }
          onClick={() => setLabwareToCalibrate(tr)}
        />
      ))}
    </TitledList>
  )
}
