// @flow
import * as React from 'react'
import cx from 'classnames'

import i18n from '../../../localization'
import {Portal} from '../../portals/MainPageModalPortal'
import {Modal, OutlineButton, LabeledValue, FormGroup} from '@opentrons/components'
import modalStyles from '../../modals/modal.css'
import { WellOrderField } from '../formFields'

import styles from './WellOrderInput.css'

type Props = {
  isOpen: boolean,
  closeModal: (e: SyntheticEvent<*>) => mixed,
  onSave: () => mixed,
}

const WellOrderModal = (props: Props) => {
  if (!props.isOpen) return null
  const handleReset = () => {
    // TODO: set to default
    props.closeModal()
  }
  return (
    <Portal>
      <Modal
        className={modalStyles.modal}
        contentsClassName={cx(modalStyles.modal_contents)}
        onCloseClick={props.onCloseClick}>
        <div className={styles.top_row}>
          <LabeledValue
            label={i18n.t('modal.well_order.title')}
            value={i18n.t('modal.well_order.body')}
            className={styles.inverted_text}
          />
        </div>
        <FormGroup
          label={i18n.t('modal.well_order.field_label')}>
          <div className={styles.field_row}>
            <WellOrderField name="aspirate_wellOrder_first" />
            {i18n.t('modal.well_order.then')}
            <WellOrderField name="aspirate_wellOrder_second" />
          </div>
        </FormGroup>
        <div className={styles.button_row}>
          <OutlineButton className={styles.default_button} onClick={handleReset}>
            {i18n.t('button.reset_to_default')}
          </OutlineButton>
          <OutlineButton onClick={props.closeModal}>
            {i18n.t('button.apply')}
          </OutlineButton>
        </div>
      </Modal>
    </Portal>

  )
}

export default WellOrderModal
