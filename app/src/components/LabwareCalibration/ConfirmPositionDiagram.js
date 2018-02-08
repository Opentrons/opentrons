// @flow
// diagram and instructions for ConfirmPositionContents
import * as React from 'react'

import type {Labware, Instrument} from '../../robot'

import styles from './styles.css'
import plateSingleSrc from '../../img/labware/plate_single.png'
import plateMultiSrc from '../../img/labware/plate_multi.png'
import troughSingleSrc from '../../img/labware/trough_single.png'
import troughMultiSrc from '../../img/labware/trough_multi.png'
import tubeSingleSrc from '../../img/labware/tuberack_single.png'
import tiprackSingleSrc from '../../img/labware/tiprack_single.png'
import tiprackMultiSrc from '../../img/labware/tiprack_multi.png'

type Props = Labware & {
  calibrator: Instrument,
  buttonText: string
}

export default function ConfirmPositionDiagram (props: Props) {
  const {
    slot,
    name,
    type,
    isTiprack,
    buttonText,
    calibrator: {mount, channels}
  } = props
  const multi = channels === 8
  const calibrator = `${mount} ${multi ? 'multi' : 'single'}-channel pipette`
  const target = isTiprack ? 'tiprack' : 'labware'
  const tipOrNozzle = isTiprack ? 'nozzle' : 'tip'
  const calibrationDescription = `${tipOrNozzle}${multi ? 's are ' : ' is '}`

  let diagramSrc

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
    diagramSrc = tubeSingleSrc
  } else {
    diagramSrc = multi
      ? plateMultiSrc
      : plateSingleSrc
  }

  return (
    <div className={styles.position_diagram}>
      <h3 className={styles.diagram_title}>
        Calibrate {target} {name} in slot {slot}
      </h3>
      <img className={styles.diagram_image} src={diagramSrc} />
      <p className={styles.diagram_instructions}>
        If necesary, jog the {calibrator} until the {calibrationDescription}
        aligned over the {target} in slot {slot} as illustrated. Once aligned,
        click [{buttonText.toUpperCase()}].
      </p>
    </div>
  )
}
