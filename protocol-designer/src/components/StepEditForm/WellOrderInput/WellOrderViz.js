// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import cx from 'classnames'

import WELLS_IMAGE from '../../../images/well_order_wells.svg'
import PATH_IMAGE from '../../../images/well_order_path.svg'

import {selectors} from '../../../steplist'
import type {WellOrderOption} from '../formFields'

import styles from './WellOrderInput.css'

type OP = {prefix: 'aspirate' | 'dispense'}

type SP = {first: WellOrderOption, second: WellOrderOption}
const WellOrderViz = (props): WellOrderVizProps => {
  return (
    <div className={styles.viz_wrapper}>
      <img src={WELLS_IMAGE} className={styles.wells_image} />
      <img
        src={PATH_IMAGE}
        className={cx(styles.path_image, styles[`${props.first}_first`], styles[`${props.second}_second`])} />
    </div>
  )
}

const mapSTP = (state: BaseState, ownProps: OP): SP => {
  const formData = selectors.getUnsavedForm(state)
  const {prefix} = ownProps
  return {
    first: formData ? formData[`${prefix}_wellOrder_first`] : null,
    second: formData ? formData[`${prefix}_wellOrder_second`] : null
  }
}

export default connect(mapSTP)(WellOrderViz)
