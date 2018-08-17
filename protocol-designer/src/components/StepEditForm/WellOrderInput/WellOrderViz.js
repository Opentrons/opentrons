// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import cn from 'classnames'

import WELLS_IMAGE from '../../../images/well_order_wells.svg'
import PATH_IMAGE from '../../../images/well_order_path.svg'

import {selectors} from '../../../steplist'
import type {StepFieldName} from '../../../steplist/fieldLevel'
import type {WellOrderOption} from '../formFields'

import styles from './WellOrderInput.css'

type OP = {firstName: StepFieldName, secondName: StepFieldName}

type SP = {first: WellOrderOption, second: WellOrderOption}
const WellOrderViz = (props): WellOrderVizProps => {
  return (
    <div className={styles.viz_wrapper}>
      <img src={WELLS_IMAGE} className={styles.wells_image} />
      <img
        src={PATH_IMAGE}
        className={cn(styles.path_image, styles[`${props.first}_first`], styles[`${props.second}_second`])} />
    </div>
  )
}

const mapSTP = (state: BaseState, ownProps: OP): SP => {
  const formData = selectors.getUnsavedForm(state)
  return {
    first: formData ? formData[ownProps.firstName] : null,
    second: formData ? formData[ownProps.secondName] : null
  }
}

export default connect(mapSTP)(WellOrderViz)
