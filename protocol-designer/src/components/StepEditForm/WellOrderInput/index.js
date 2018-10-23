// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {FormGroup} from '@opentrons/components'
import cx from 'classnames'
import i18n from '../../../localization'
import {selectors} from '../../../steplist'
import styles from './WellOrderInput.css'
import WellOrderModal from './WellOrderModal'
import ZIG_ZAG_IMAGE from '../../../images/zig_zag_icon.svg'
import type {BaseState} from '../../../types'

type OP = {prefix: 'aspirate' | 'dispense'}
type SP = {iconClassNames: Array<string>}

type WellOrderInputState = {isModalOpen: boolean}
class WellOrderInput extends React.Component<OP & SP, WellOrderInputState> {
  state: WellOrderInputState = {isModalOpen: false}

  handleOpen = () => { this.setState({isModalOpen: true}) }
  handleClose = () => { this.setState({isModalOpen: false}) }

  render () {
    return (
      <FormGroup
        label={i18n.t('form.step_edit_form.field.well_order.label')}
        className={styles.well_order_input}>
        <WellOrderModal
          prefix={this.props.prefix}
          closeModal={this.handleClose}
          isOpen={this.state.isModalOpen} />
        <img
          onClick={this.handleOpen}
          src={ZIG_ZAG_IMAGE}
          className={cx(styles.well_order_icon, ...this.props.iconClassNames)} />
      </FormGroup>
    )
  }
}

const mapSTP = (state: BaseState, ownProps: OP): SP => {
  const formData = selectors.getUnsavedForm(state)
  // NOTE: not interpolating prefix because breaks flow string enum
  const firstName = ownProps.prefix === 'aspirate' ? 'aspirate_wellOrder_first' : 'dispense_wellOrder_first'
  const secondName = ownProps.prefix === 'aspirate' ? 'aspirate_wellOrder_second' : 'dispense_wellOrder_second'

  let iconClassNames = []
  if (formData) {
    const first = formData[firstName]
    const second = formData[secondName]
    iconClassNames = [styles[`${first}_first`], styles[`${second}_second`]]
  }
  return { iconClassNames }
}

export default connect(mapSTP)(WellOrderInput)
