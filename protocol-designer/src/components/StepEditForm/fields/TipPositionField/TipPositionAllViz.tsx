import round from 'lodash/round'

import PIPETTE_TIP_IMAGE from '../../../../assets/images/pipette_tip.svg'
import WELL_CROSS_SECTION_IMAGE from '../../../../assets/images/well_cross_section.svg'

import styles from './TipPositionInput.module.css'

const WELL_HEIGHT_PIXELS = 145
const WELL_WIDTH_PIXELS = 100
const PIXEL_DECIMALS = 2

interface TipPositionAllVizProps {
  mmFromBottom: number
  xPosition: number
  wellDepthMm: number
  xWidthMm: number
}

export function TipPositionAllViz(props: TipPositionAllVizProps): JSX.Element {
  const { mmFromBottom, xPosition, wellDepthMm, xWidthMm } = props
  const fractionOfWellHeight = mmFromBottom / wellDepthMm
  const pixelsFromBottom =
    Number(fractionOfWellHeight) * WELL_HEIGHT_PIXELS - WELL_HEIGHT_PIXELS
  const roundedPixelsFromBottom = round(pixelsFromBottom, PIXEL_DECIMALS)
  const bottomPx = wellDepthMm
    ? roundedPixelsFromBottom
    : mmFromBottom - WELL_HEIGHT_PIXELS

  const xPx = (WELL_WIDTH_PIXELS / xWidthMm) * xPosition
  const roundedXPx = round(xPx, PIXEL_DECIMALS)
  return (
    <div className={styles.viz_wrapper}>
      <img
        src={PIPETTE_TIP_IMAGE}
        className={styles.pipette_tip_image}
        style={{
          bottom: `${bottomPx}px`,
          left: `calc(${roundedXPx}px - 22px)`,
        }}
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
