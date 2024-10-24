import WELLS_IMAGE from '../../../../assets/images/well_order_wells.svg'
import PATH_IMAGE from '../../../../assets/images/well_order_path.svg'

import styles from './WellOrderInput.module.css'
import { WellOrderOption } from '../../form-types'

interface WellOrderVisualizationProps {
  firstValue: WellOrderOption
  secondValue: WellOrderOption
}

export const WellOrderVisualization = (
  props: WellOrderVisualizationProps
): JSX.Element => {
  const { firstValue, secondValue } = props

  return (
    <div></div>
    // <div className={styles.viz_wrapper}>
    //   <img src={WELLS_IMAGE} className={styles.wells_image} />
    //   <img
    //     src={PATH_IMAGE}
    //     className={cx(
    //       styles.path_image,
    //       styles[`${firstValue || ''}_first`],
    //       styles[`${secondValue || ''}_second`]
    //     )}
    //   />
    // </div>
  )
}
