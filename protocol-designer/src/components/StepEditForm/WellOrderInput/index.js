// @flow
import * as React from 'react'
import {FormGroup} from '@opentrons/components'
import i18n from '../../../localization'
import StepField from '../StepFormField'
import styles from './WellOrderInput.css'
import WellOrderModal from './WellOrderModal'

type WellOrderInputState = {isModalOpen: boolean}
class WellOrderInput extends React.Component<null, WellOrderInputState> {
  state: WellOrderInputState = {isModalOpen: false}

  handleOpen = () => { this.setState({isModalOpen: true}) }
  handleClose = () => { this.setState({isModalOpen: false}) }

  // TODO: options type tuple of enum '12r' | 'r21' | 't2b' | 'b2t'
  render () {
    return (
      <FormGroup
        label={i18n.t('step_edit_form.field.well_order.label')}
        className={styles.well_order_input}
        >
        <WellOrderModal onCloseClick={this.handleClose} isOpen={this.state.isModalOpen} />
        <StepField
          name="aspirate_wellOrder"
          render={({value, updateValue}) => (
            <div onClick={this.handleOpen} className={styles.well_order_icon}>

            </div>
          )} />
      </FormGroup>
    )
  }
}

export default WellOrderInput
