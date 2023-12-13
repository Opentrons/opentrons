import * as React from 'react'
import cx from 'classnames'
import { OutlineButton, DeprecatedPrimaryButton } from '@opentrons/components'
import { i18n } from '../../../localization'

import modalStyles from '../../modals/modal.module.css'
import styles from './styles.module.css'

interface ButtonRowProps {
  handleClickMoreOptions: () => unknown
  handleClose: () => unknown
  handleSave: () => unknown
  handleDelete: () => unknown
  canSave: boolean
}

export const ButtonRow = (props: ButtonRowProps): JSX.Element => {
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
        <DeprecatedPrimaryButton
          className={styles.form_button}
          onClick={handleClose}
        >
          {i18n.t('button.close')}
        </DeprecatedPrimaryButton>
        <DeprecatedPrimaryButton
          className={styles.form_button}
          disabled={!canSave}
          onClick={handleSave}
        >
          {i18n.t('button.save')}
        </DeprecatedPrimaryButton>
      </div>
    </div>
  )
}
