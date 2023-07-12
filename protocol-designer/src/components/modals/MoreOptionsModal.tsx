import * as React from 'react'
import { connect } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  FormGroup,
  InputField,
  Modal,
  OutlineButton,
} from '@opentrons/components'

import { actions as steplistActions } from '../../steplist'
import { StepFieldName } from '../../steplist/fieldLevel'
import { FormData } from '../../form-types'
import { ThunkDispatch } from '../../types'
import modalStyles from './modal.css'
import styles from './MoreOptionsModal.css'

interface OP {
  close: (event?: React.MouseEvent) => unknown
  formData: FormData
}

interface DP {
  saveValuesToForm: (
    args: {
      [K in StepFieldName]: unknown | null | undefined
    }
  ) => unknown
}

type Props = OP & DP

const MoreOptionsModalComponent: React.FC<Props> = ({
  close,
  formData,
  saveValuesToForm,
}) => {
  const { t } = useTranslation(['modal', 'form', 'button'])
  const [stepName, setStepName] = React.useState(formData?.stepName)
  const [stepDetails, setStepDetails] = React.useState(formData?.stepDetails)

  const makeHandleChange = (fieldName: StepFieldName) => (
    e: React.ChangeEvent<any>
  ) => {
    if (fieldName === 'stepName') {
      setStepName(e.currentTarget.value)
    } else if (fieldName === 'stepDetails') {
      setStepDetails(e.currentTarget.value)
    }
  }

  const handleSave = (): void => {
    saveValuesToForm({ stepName, stepDetails })
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
            value={String(stepName)}
          />
        </FormGroup>

        <FormGroup
          label={t('form:step_edit_form.field.step_notes.label')}
          className={styles.form_group}
        >
          <textarea
            className={styles.text_area_large}
            onChange={makeHandleChange('stepDetails')}
            value={stepDetails}
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
const mapDispatchToProps = (dispatch: ThunkDispatch<any>): DP => ({
  saveValuesToForm: update =>
    dispatch(steplistActions.changeFormInput({ update })),
})

export const MoreOptionsModal = connect(
  null,
  mapDispatchToProps
)(MoreOptionsModalComponent)
