// @flow
import * as React from 'react'

import PIPETTE_TIP_IMAGE from '../../../images/pipette_tip.svg'
import WELL_CROSS_SECTION_IMAGE from '../../../images/well_cross_section.svg'

import styles from './TipPositionInput.css'

const WELL_HEIGHT_PIXELS = 40
type Props = { tipPosition: number }

const TipPositionViz = (props: Props) => {
  // TODO: from labware
  const wellHeightMM = 30

  const fractionOfWellHeight = Number(props.tipPosition) / wellHeightMM
  const pixelsFromBottom = Math.floor((Number(fractionOfWellHeight) * WELL_HEIGHT_PIXELS) - WELL_HEIGHT_PIXELS)
  const roundedPixelsFromBottom = String(pixelsFromBottom.toFixed(2))
  return (
    <div className={styles.viz_wrapper}>
      <img
        src={PIPETTE_TIP_IMAGE}
        className={styles.pipette_tip_image}
        style={{bottom: `${roundedPixelsFromBottom}px`}} />
      <img
        src={WELL_CROSS_SECTION_IMAGE}
        className={styles.well_cross_section_image}
        style={{height: `${WELL_HEIGHT_PIXELS}px`}} />
    </div>
  )
}
export default TipPositionViz
