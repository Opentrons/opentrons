// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {FormGroup} from '@opentrons/components'
import i18n from '../../../localization'
import type {BaseState, Dispatch} from '../../../types'
import {actions as steplistActions, selectors as steplistSelectors} from '../../../steplist'
import type {StepFieldName} from '../../../steplist/fieldLevel'
import styles from './WellOrderInput.css'

type Props = {
  name: StepFieldName,
  selectedWellOrder: any, // TODO: type tuple of enum '12r' | 'r21' | 't2b' | 'b2t'
  openWellOrderModal: () => mixed
}

class WellOrderInput extends React.Component<Props> {
  handleClick = () => {
    this.props.openWellOrderModal()
  }

  render () {
    return (
      <FormGroup
        label={i18n.t('step_edit_form.field.well_order.label')}
        className={styles.well_order_input}
        >
          <div onClick={this.handleClick} className={styles.well_order_icon}>

          </div>
      </FormGroup>
    )
  }
}

const mapSTP = (state: BaseState): SP => ({
  selectedWellOrder: steplistSelectors.selectedWellOrder(state)
})

const mapDTP = (dispatch: Dispatch) => ({
  openWellOrderModal: () => dispatch(steplistActions.openWellOrderModal)
})

export default connect(mapSTP, mapDTP)(WellOrderInput)
