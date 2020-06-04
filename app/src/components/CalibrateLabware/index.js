// @flow
// info panel and controls for labware calibration page
import * as React from 'react'
import { withRouter } from 'react-router-dom'

import { DeckMap } from '../DeckMap'
import { InfoBox } from './InfoBox'
import styles from './styles.css'

import type { ContextRouter } from 'react-router-dom'
import type { Labware } from '../../robot/types'

type Props = {| ...ContextRouter, labware: ?Labware |}

export const CalibrateLabware: React.AbstractComponent<
  $Diff<Props, ContextRouter>
> = withRouter(CalibrateLabwareComponent)

function CalibrateLabwareComponent(props: Props) {
  return (
    <div className={styles.calibrate_labware_wrapper}>
      <InfoBox labware={props.labware} />
      <DeckMap className={styles.deck_map} enableLabwareSelection />
    </div>
  )
}
