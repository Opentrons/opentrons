import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  FormGroup,
  InputField,
  Modal,
  OutlineButton,
} from '@opentrons/components'
import { actions as steplistActions } from '../../steplist'
import { StepFieldName } from '../../steplist/fieldLevel'
import modalStyles from './modal.module.css'
import styles from './MoreOptionsModal.module.css'

import type { FormData } from '../../form-types'
import type { ChangeFormPayload } from '../../steplist/actions'


interface Props {
  close: (event?: React.MouseEvent) => unknown
  formData: FormData
}

export function MoreOptionsModal(props: Props): JSX.Element {
  const { t } = useTranslation(['modal', 'form', 'button'])
  const { formData, close } = props
  const dispatch = useDispatch()

  const makeHandleChange = (fieldName: StepFieldName) => (
    e: React.ChangeEvent<any>
  ) => {
    const { stepId } = formData
    const updatePayload: ChangeFormPayload = {
      stepId,
      update: {
        [fieldName]: e.currentTarget.value,
      },
    }
    dispatch(steplistActions.changeFormInput(updatePayload))
  }

  const handleSave = (): void => {
    dispatch(steplistActions.changeFormInput({ update: { ...formData } }))
    close()
  }

  return (
    <Modal
      heading={t('step_notes.title')}
      className={modalStyles.modal}
      contentsClassName={styles.modal_contents}
    >
      <div>
        <FormGroup
          label={t('form:step_edit_form.field.step_name.label')}
          className={styles.form_group}
        >
          <InputField
            onChange={makeHandleChange('stepName')}
            value={String(formData.stepName)}
          />
        </FormGroup>

        <FormGroup
          label={t('form:step_edit_form.field.step_notes.label')}
          className={styles.form_group}
        >
          <textarea
            className={styles.text_area_large}
            onChange={makeHandleChange('stepDetails')}
            value={formData.stepDetails}
          />
        </FormGroup>
        <div className={modalStyles.button_row}>
          <OutlineButton onClick={close} className={styles.cancel_button}>
            {t('button:cancel')}
          </OutlineButton>
          <OutlineButton onClick={handleSave}>{t('button:save')}</OutlineButton>
        </div>
      </div>
    </Modal>
  )
}
