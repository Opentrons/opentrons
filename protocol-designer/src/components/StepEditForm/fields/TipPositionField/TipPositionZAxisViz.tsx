import * as React from 'react'
import round from 'lodash/round'

import PIPETTE_TIP_IMAGE from '../../../../images/pipette_tip.svg'
import WELL_CROSS_SECTION_IMAGE from '../../../../images/well_cross_section.svg'

import styles from './TipPositionInput.module.css'

const WELL_HEIGHT_PIXELS = 145
const PIXEL_DECIMALS = 2
interface TipPositionZAxisVizProps {
  wellDepthMm: number
  mmFromBottom?: number
  mmFromTop?: number
}

export const TipPositionZAxisViz = (
  props: TipPositionZAxisVizProps
): JSX.Element => {
  const { mmFromBottom, mmFromTop, wellDepthMm } = props
  let positionInTube = 0
  if (mmFromBottom != null) {
    positionInTube = mmFromBottom
  } else if (mmFromTop != null) {
    positionInTube = mmFromTop
  }
  const fractionOfWellHeight = positionInTube / wellDepthMm
  const pixelsFromBottom =
    Number(fractionOfWellHeight) * WELL_HEIGHT_PIXELS -
    (mmFromBottom != null ? WELL_HEIGHT_PIXELS : 0)
  const roundedPixelsFromBottom = round(pixelsFromBottom, PIXEL_DECIMALS)

  const bottomPx = roundedPixelsFromBottom

  return (
    <div className={styles.viz_wrapper}>
      <img
        src={PIPETTE_TIP_IMAGE}
        className={styles.pipette_tip_image}
        style={{ bottom: `${bottomPx}px` }}
      />
      {props.wellDepthMm !== null && (
        <span className={styles.well_height_label}>{props.wellDepthMm}mm</span>
      )}
      <img
        src={WELL_CROSS_SECTION_IMAGE}
        className={styles.well_cross_section_image}
      />
    </div>
  )
}
