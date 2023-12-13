import * as React from 'react'
import { connect } from 'react-redux'
import {
  FormGroup,
  InputField,
  Modal,
  OutlineButton,
} from '@opentrons/components'

import { i18n } from '../../localization'
import { actions as steplistActions } from '../../steplist'
import { StepFieldName } from '../../steplist/fieldLevel'
import { FormData } from '../../form-types'
import { ThunkDispatch } from '../../types'
import modalStyles from './modal.module.css'
import styles from './MoreOptionsModal.module.css'

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
interface State {
  stepDetails: any
  stepName: unknown
  [key: string]: unknown
}
class MoreOptionsModalComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const { stepName, stepDetails } = props.formData || {}
    this.state = { stepName, stepDetails }
  }

  makeHandleChange = (fieldName: StepFieldName) => (
    e: React.ChangeEvent<any>
  ) => {
    this.setState({ [fieldName]: e.currentTarget.value })
  }

  handleSave = (): void => {
    this.props.saveValuesToForm(this.state)
    this.props.close()
  }

  render(): JSX.Element {
    return (
      <Modal
        heading={i18n.t('modal.step_notes.title')}
        className={modalStyles.modal}
        contentsClassName={styles.modal_contents}
      >
        <div>
          <FormGroup
            label={i18n.t('form.step_edit_form.field.step_name.label')}
            className={styles.form_group}
          >
            <InputField
              onChange={this.makeHandleChange('stepName')}
              value={String(this.state.stepName)}
            />
          </FormGroup>

          <FormGroup
            label={i18n.t('form.step_edit_form.field.step_notes.label')}
            className={styles.form_group}
          >
            <textarea
              className={styles.text_area_large}
              onChange={this.makeHandleChange('stepDetails')}
              value={this.state.stepDetails}
            />
          </FormGroup>
          <div className={modalStyles.button_row}>
            <OutlineButton
              onClick={this.props.close}
              className={styles.cancel_button}
            >
              {i18n.t('button.cancel')}
            </OutlineButton>
            <OutlineButton onClick={this.handleSave}>
              {i18n.t('button.save')}
            </OutlineButton>
          </div>
        </div>
      </Modal>
    )
  }
}

const mapDispatchToProps = (dispatch: ThunkDispatch<any>): DP => ({
  saveValuesToForm: update =>
    dispatch(steplistActions.changeFormInput({ update })),
})

export const MoreOptionsModal = connect(
  null,
  mapDispatchToProps
)(MoreOptionsModalComponent)
