// @flow
// diagram and instructions for ConfirmPositionContents
import * as React from 'react'

import type {Labware, Instrument} from '../../robot'

import styles from './styles.css'

import plate96SingleSrc from './images/96-well-plate-calibration-single.png'
import plate96MultiSrc from './images/96-well-plate-calibration-multi.png'

import plate384SingleSrc from './images/384-well-plate-calibration-single.png'
import plate384MultiSrc from './images/384-well-plate-calibration-multi.png'

import troughSingleSrc from './images/trough-calibration-single.png'
import troughMultiSrc from './images/trough-calibration-multi.png'

import tiprackSingleSrc from './images/tiprack-calibration-single.png'
import tiprackMultiSrc from './images/tiprack-calibration-multi.png'

import tubeRackSrc from './images/tube-rack-calibration.png'

type Props = Labware & {
  calibrator: Instrument,
  buttonText: string
}

export default function ConfirmPositionDiagram (props: Props) {
  const {type, isTiprack, calibrator: {channels}} = props
  const multi = channels === 8
  let diagramSrc

  // TODO(mc, 2018-03-2018): move to labware-definitions? Generate via
  //   components library? Refactor somehow is what I'm saying
  if (isTiprack) {
    diagramSrc = multi
      ? tiprackMultiSrc
      : tiprackSingleSrc
  } else if (type.includes('trough')) {
    diagramSrc = multi
      ? troughMultiSrc
      : troughSingleSrc
  } else if (type.includes('tube-rack')) {
    // TODO(mc, 2018-02-07): tube rack with multi??
    // consider `assert` here
    if (multi) console.warn('Warning: calibrating tube-rack w/ multi-channel')
    diagramSrc = tubeRackSrc
  } else if (type.includes('384')) {
    diagramSrc = multi
      ? plate384MultiSrc
      : plate384SingleSrc
  } else {
    diagramSrc = multi
      ? plate96MultiSrc
      : plate96SingleSrc
  }

  return (
    <div className={styles.position_diagram}>
      <img className={styles.diagram_image} src={diagramSrc} />
    </div>
  )
}
