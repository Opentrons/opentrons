// @flow
// info panel for labware calibration page
import * as React from 'react'

import type {Labware} from '../../robot'

import {UNCHECKED, CHECKED} from '@opentrons/components'
import CalibrationInfoBox from '../CalibrationInfoBox'

// TODO(mc, 2018-02-05): match screens instead of using this old component
// import ConfirmCalibrationPrompt from '../deck/ConfirmCalibrationPrompt'

type Props = {labware: ?Labware}

export default function InfoBox (props: Props) {
  const {labware} = props
  const title = labware
    ? `${labware.name} - ${labware.type}`
    : 'No labware selected'

  const iconName = labware && labware.confirmed
    ? CHECKED
    : UNCHECKED

  return (
    <CalibrationInfoBox iconName={iconName} title={title}>
      {false}
    </CalibrationInfoBox>
  )
}
