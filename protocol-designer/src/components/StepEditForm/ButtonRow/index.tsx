import * as React from 'react'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'
import { OutlineButton, DeprecatedPrimaryButton } from '@opentrons/components'

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
  const { t } = useTranslation('button')
  return (
    <div className={cx(modalStyles.button_row_divided, styles.form_wrapper)}>
      <div>
        <OutlineButton className={styles.form_button} onClick={handleDelete}>
          {t('delete')}
        </OutlineButton>
        <OutlineButton
          className={styles.form_button}
          onClick={handleClickMoreOptions}
        >
          {t('notes')}
        </OutlineButton>
      </div>
      <div>
        <DeprecatedPrimaryButton
          className={styles.form_button}
          onClick={handleClose}
        >
          {t('close')}
        </DeprecatedPrimaryButton>
        <DeprecatedPrimaryButton
          className={styles.form_button}
          disabled={!canSave}
          onClick={handleSave}
        >
          {t('save')}
        </DeprecatedPrimaryButton>
      </div>
    </div>
  )
}
