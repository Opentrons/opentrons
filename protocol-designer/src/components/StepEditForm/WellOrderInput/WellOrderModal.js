// @flow
import * as React from 'react'
import cx from 'classnames'
import {connect} from 'react-redux'

import i18n from '../../../localization'
import {Portal} from '../../portals/MainPageModalPortal'
import {Modal, OutlineButton, LabeledValue, FormGroup} from '@opentrons/components'
import modalStyles from '../../modals/modal.css'
import {actions} from '../../../steplist'
import { WellOrderField } from '../fields'
import WellOrderViz from './WellOrderViz'

import styles from './WellOrderInput.css'

type DP = { setDefaults: () => mixed }

type Props = {
  isOpen: boolean,
  closeModal: (e: SyntheticEvent<*>) => mixed,
  onSave: () => mixed,
  prefix: 'aspirate' | 'dispense'
}

class WellOrderModal extends React.Component<Props & DP> {
  handleReset = () => {
    this.props.setDefaults()
    this.props.closeModal()
  }
  handleClose = () => {
    this.props.closeModal()
  }
  render () {
    if (!this.props.isOpen) return null
    return (
      <Portal>
        <Modal
          className={modalStyles.modal}
          contentsClassName={cx(modalStyles.modal_contents)}
          onCloseClick={this.handleClose}>
          <div className={styles.top_row}>
            <LabeledValue
              label={i18n.t('modal.well_order.title')}
              value={i18n.t('modal.well_order.body')} />
          </div>
          <div className={styles.main_row}>
            <FormGroup label={i18n.t('modal.well_order.field_label')}>
              <div className={styles.field_row}>
                <WellOrderField prefix={this.props.prefix} ordinality="first" />
                <span className={styles.field_spacer}>{i18n.t('modal.well_order.then')}</span>
                <WellOrderField prefix={this.props.prefix} ordinality="second" />
              </div>
            </FormGroup>
            <FormGroup label={i18n.t('modal.well_order.viz_label')} className={styles.viz_wrapper}>
              <WellOrderViz prefix={this.props.prefix} />
            </FormGroup>
          </div>
          <div className={styles.button_row}>
            <OutlineButton className={styles.default_button} onClick={this.handleReset}>
              {i18n.t('button.reset_to_default')}
            </OutlineButton>
            <OutlineButton onClick={this.handleClose}>
              {i18n.t('button.done')}
            </OutlineButton>
          </div>
        </Modal>
      </Portal>
    )
  }
}

const mapDTP = (dispatch: Dispatch, ownProps): DP => {
  const {prefix} = ownProps
  return {
    // TODO: BC 2018-08-19 put these defaults in consolidated location
    setDefaults: () => {
      dispatch(actions.changeFormInput({update: {[`${prefix}_wellOrder_first`]: 'l2r'}}))
      dispatch(actions.changeFormInput({update: {[`${prefix}_wellOrder_second`]: 't2b'}}))
    }
  }
}

export default connect(null, mapDTP)(WellOrderModal)
