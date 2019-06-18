// @flow
// info panel and controls for labware calibration page
import * as React from 'react'
import { withRouter } from 'react-router'
import type { Labware } from '../../robot'
import DeckMap from '../DeckMap'
import InfoBox from './InfoBox'
import styles from './styles.css'

type Props = { labware: ?Labware }

export default withRouter<$Exact<Props>>(CalibrateLabware)

function CalibrateLabware(props: Props) {
  return (
    <div className={styles.calibrate_labware_wrapper}>
      <InfoBox labware={props.labware} />
      <DeckMap enableLabwareSelection />
    </div>
  )
}
