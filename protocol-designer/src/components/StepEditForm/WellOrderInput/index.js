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

type OP = {prefix: 'aspirate' | 'dispense'}
type SP = {iconClassNames: Array<string>}

type WellOrderInputState = {isModalOpen: boolean}
class WellOrderInput extends React.Component<null, WellOrderInputState> {
  state: WellOrderInputState = {isModalOpen: false}

  handleOpen = () => { this.setState({isModalOpen: true}) }
  handleClose = () => { this.setState({isModalOpen: false}) }

  render () {
    return (
      <FormGroup
        label={i18n.t('step_edit_form.field.well_order.label')}
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
  const {prefix} = ownProps
  let iconClassNames = []
  if (formData) {
    const first = formData[`${prefix}_wellOrder_first`]
    const second = formData[`${prefix}_wellOrder_second`]
    iconClassNames = [styles[`${first}_first`], styles[`${second}_second`]]
  }
  return { iconClassNames }
}

export default connect(mapSTP)(WellOrderInput)
