import round from 'lodash/round'

import PIPETTE_TIP_IMAGE from '../../../../assets/images/pipette_tip.svg'
import WELL_CROSS_SECTION_IMAGE from '../../../../assets/images/well_cross_section.svg'

import styles from './TipPositionInput.module.css'

const WELL_HEIGHT_PIXELS = 145
const TIP_X_OFFSET_PIXELS = 22
const PIXEL_DECIMALS = 2
interface TipPositionZAxisVizProps {
  wellDepthMm: number
  mmFromBottom?: number
  mmFromTop?: number
}

export function TipPositionZAxisViz(
  props: TipPositionZAxisVizProps
): JSX.Element {
  const { mmFromBottom, mmFromTop, wellDepthMm } = props
  const positionInTube = mmFromBottom ?? mmFromTop ?? 0
  const fractionOfWellHeight = positionInTube / wellDepthMm
  const pixelsFromBottom =
    fractionOfWellHeight * WELL_HEIGHT_PIXELS -
    (mmFromBottom != null ? WELL_HEIGHT_PIXELS : 0)
  const bottomPx = round(pixelsFromBottom, PIXEL_DECIMALS)

  return (
    <div className={styles.viz_wrapper}>
      <img
        src={PIPETTE_TIP_IMAGE}
        className={styles.pipette_tip_image}
        style={{ bottom: `${bottomPx}px`, right: `${TIP_X_OFFSET_PIXELS}px` }}
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
