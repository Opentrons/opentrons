// @flow
import * as React from 'react'

import PIPETTE_TIP_IMAGE from '../../../images/pipette_tip.svg'
import WELL_CROSS_SECTION_IMAGE from '../../../images/well_cross_section.svg'

import styles from './TipPositionInput.css'

const WELL_HEIGHT_PIXELS = 48
type Props = {
  mmFromBottom: string,
  wellHeightMM: number
}

const TipPositionZAxisViz = (props: Props) => {
  const fractionOfWellHeight = Number(props.mmFromBottom) / props.wellHeightMM
  const pixelsFromBottom = (Number(fractionOfWellHeight) * WELL_HEIGHT_PIXELS) - WELL_HEIGHT_PIXELS
  const roundedPixelsFromBottom = String(pixelsFromBottom.toFixed(2))
  const bottomPx = props.wellHeightMM ? roundedPixelsFromBottom : (parseFloat(props.mmFromBottom) - WELL_HEIGHT_PIXELS)
  return (
    <div className={styles.viz_wrapper}>
      <img
        src={PIPETTE_TIP_IMAGE}
        className={styles.pipette_tip_image}
        style={{bottom: `${bottomPx}px`}} />
      {props.wellHeightMM !== null && <span className={styles.well_height_label}>{props.wellHeightMM}mm</span>}
      <img
        src={WELL_CROSS_SECTION_IMAGE}
        className={styles.well_cross_section_image} />
    </div>
  )
}
export default TipPositionZAxisViz
