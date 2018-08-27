// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {FormGroup} from '@opentrons/components'
import i18n from '../../../localization'
import {selectors} from '../../../steplist'
import styles from './TipPositionInput.css'
import TipPositionModal from './TipPositionModal'
import type {BaseState} from '../../../types'

type OP = {prefix: 'aspirate' | 'dispense'}
type SP = {tipPosition: number}

type TipPositionInputState = {isModalOpen: boolean}
class TipPositionInput extends React.Component<OP & SP, TipPositionInputState> {
  state: TipPositionInputState = {isModalOpen: false}

  handleOpen = () => { this.setState({isModalOpen: true}) }
  handleClose = () => { this.setState({isModalOpen: false}) }

  render () {
    return (
      <FormGroup
        label={i18n.t('step_edit_form.field.tip_position.label')}
        className={styles.well_order_input}>
        <TipPositionModal
          prefix={this.props.prefix}
          closeModal={this.handleClose}
          isOpen={this.state.isModalOpen} />
          <div onClick={this.handleOpen}>TODO: value</div>
      </FormGroup>
    )
  }
}
const mapSTP = (state: BaseState, ownProps: OP): SP => {
  const formData = selectors.getUnsavedForm(state)
  const fieldName = ownProps.prefix === 'aspirate' ? 'aspirate_tipPosition' : 'dispense_tipPosition'

  return {tipPosition: formData && formData[fieldName]}
}

export default connect(mapSTP)(TipPositionInput)
