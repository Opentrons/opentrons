// @flow
import * as React from 'react'

import PIPETTE_TIP_IMAGE from '../../../images/pipette_tip.svg'
import WELL_CROSS_SECTION_IMAGE from '../../../images/well_cross_section.svg'

import styles from './TipPositionInput.css'

const WELL_HEIGHT_PIXELS = 40
type Props = { tipPosition: number }

const TipPositionViz = (props: Props) => {
  const pixelsFromBottom = String(Number(props.tipPosition) - WELL_HEIGHT_PIXELS)
  console.log(WELL_HEIGHT_PIXELS)
  console.log(props.tipPosition)
  return (
    <div className={styles.viz_wrapper}>
      {props.tipPosition}
      <img
        src={PIPETTE_TIP_IMAGE}
        className={styles.pipette_tip_image}
        style={{bottom: `${pixelsFromBottom}px`}} />
      <img src={WELL_CROSS_SECTION_IMAGE} className={styles.well_cross_section_image} />
    </div>
  )
}
export default TipPositionViz
