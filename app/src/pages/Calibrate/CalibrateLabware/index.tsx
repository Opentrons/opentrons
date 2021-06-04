// info panel and controls for labware calibration page
import * as React from 'react'
import { withRouter } from 'react-router-dom'

import { DeckMap } from '../../../molecules/DeckMap'
import { InfoBox } from './InfoBox'
import styles from './styles.css'

import type { RouteComponentProps } from 'react-router-dom'
import type { Labware } from '../../../redux/robot/types'

interface Props extends RouteComponentProps<{ slot: string }> {
  labware: Labware | null | undefined
}

export const CalibrateLabware = withRouter(CalibrateLabwareComponent)

function CalibrateLabwareComponent(props: Props): JSX.Element {
  return (
    <div className={styles.calibrate_labware_wrapper}>
      <InfoBox labware={props.labware} />
      <DeckMap className={styles.deck_map} enableLabwareSelection />
    </div>
  )
}
