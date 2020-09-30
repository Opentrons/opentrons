// @flow
import * as React from 'react'
import cx from 'classnames'
import { OutlineButton, PrimaryButton } from '@opentrons/components'
import { i18n } from '../../../localization'

import modalStyles from '../../modals/modal.css'
import styles from './styles.css'

type ButtonRowProps = {|
  handleClickMoreOptions: () => mixed,
  handleClose: () => mixed,
  handleSave: () => mixed,
  handleDelete: () => mixed,
  canSave: boolean,
|}

export const ButtonRow = (props: ButtonRowProps): React.Node => {
  const {
    handleDelete,
    handleClickMoreOptions,
    handleClose,
    handleSave,
    canSave,
  } = props

  return (
    <div className={cx(modalStyles.button_row_divided, styles.form_wrapper)}>
      <div>
        <OutlineButton className={styles.form_button} onClick={handleDelete}>
          {i18n.t('button.delete')}
        </OutlineButton>
        <OutlineButton
          className={styles.form_button}
          onClick={handleClickMoreOptions}
        >
          {i18n.t('button.notes')}
        </OutlineButton>
      </div>
      <div>
        <PrimaryButton className={styles.form_button} onClick={handleClose}>
          {i18n.t('button.close')}
        </PrimaryButton>
        <PrimaryButton
          className={styles.form_button}
          disabled={!canSave}
          onClick={handleSave}
        >
          {i18n.t('button.save')}
        </PrimaryButton>
      </div>
    </div>
  )
}
