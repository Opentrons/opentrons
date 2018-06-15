// @flow
// info panel and controls for labware calibration page
import * as React from 'react'
import {withRouter} from 'react-router'
import type {Labware} from '../../robot'
import DeckMap from '../DeckMap'
import InfoBox from './InfoBox'

type Props = {
  labware: ?Labware
}
export default withRouter(LabwareCalibration)

function LabwareCalibration (props: Props) {
  return (
    <div>
      <InfoBox {...props} />
      <DeckMap />
    </div>
  )
}
