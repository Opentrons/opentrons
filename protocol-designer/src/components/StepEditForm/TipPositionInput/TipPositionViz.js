// @flow
import * as React from 'react'

import PIPETTE_TIP_IMAGE from '../../../images/pipette_tip.svg'
import WELL_CROSS_SECTION_IMAGE from '../../../images/well_cross_section.svg'

import styles from './TipPositionInput.css'

const WELL_HEIGHT_PIXELS = 48
type Props = {
  tipPosition: number,
  wellHeightMM: number
}

const TipPositionViz = (props: Props) => {
  const fractionOfWellHeight = Number(props.tipPosition) / props.wellHeightMM
  const pixelsFromBottom = (Number(fractionOfWellHeight) * WELL_HEIGHT_PIXELS) - WELL_HEIGHT_PIXELS
  const roundedPixelsFromBottom = String(pixelsFromBottom.toFixed(2))
  return (
    <div className={styles.viz_wrapper}>
      <img
        src={PIPETTE_TIP_IMAGE}
        className={styles.pipette_tip_image}
        style={{bottom: `${roundedPixelsFromBottom}px`}} />
      <span className={styles.well_height_label}>{props.wellHeightMM}mm</span>
      <img
        src={WELL_CROSS_SECTION_IMAGE}
        className={styles.well_cross_section_image} />
        {/* style={{height: `${WELL_HEIGHT_PIXELS}px`}} /> */}
    </div>
  )
}
export default TipPositionViz
