// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { FlatButton, FormGroup, InputField, Modal } from '@opentrons/components'

import i18n from '../../localization'
import { actions as steplistActions } from '../../steplist'
import type { StepFieldName } from '../../steplist/fieldLevel'
import type { FormData } from '../../form-types'
import type { ThunkDispatch } from '../../types'
import styles from './MoreOptionsModal.css'
import modalStyles from './modal.css'

type OP = {|
  close: (event: ?SyntheticEvent<>) => mixed,
  formData: FormData,
|}

type DP = {|
  saveValuesToForm: ({ [StepFieldName]: ?mixed }) => mixed,
|}

type Props = {| ...OP, ...DP |}
type State = { [StepFieldName]: ?mixed }

class MoreOptionsModalComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const { stepName, stepDetails } = props.formData || {}
    this.state = { stepName, stepDetails }
  }

  makeHandleChange = (fieldName: StepFieldName) => (
    e: SyntheticInputEvent<*>
  ) => {
    this.setState({ [fieldName]: e.currentTarget.value })
  }

  handleSave = () => {
    this.props.saveValuesToForm(this.state)
    this.props.close()
  }

  render() {
    return (
      <Modal
        onCloseClick={this.props.close}
        className={modalStyles.modal}
        contentsClassName={modalStyles.modal_contents}
      >
        <div>
          <FormGroup
            label={i18n.t('form.step_edit_form.field.step_name.label')}
            className={styles.column_1_2}
          >
            <InputField
              onChange={this.makeHandleChange('stepName')}
              value={String(this.state.stepName)}
            />
          </FormGroup>
          <FormGroup
            label={i18n.t('form.step_edit_form.field.step_notes.label')}
            className={styles.column_1_2}
          >
            {/* TODO: need textarea input in component library for big text boxes. */}
            <textarea
              className={styles.big_text_box}
              onChange={this.makeHandleChange('stepDetails')}
              value={this.state.stepDetails}
            />
          </FormGroup>
          <div className={styles.button_row}>
            <FlatButton onClick={this.props.close}>
              {i18n.t('button.cancel')}
            </FlatButton>
            <FlatButton onClick={this.handleSave}>
              {i18n.t('button.save')}
            </FlatButton>
          </div>
        </div>
      </Modal>
    )
  }
}

const mapDispatchToProps = (dispatch: ThunkDispatch<*>): DP => ({
  saveValuesToForm: update =>
    dispatch(steplistActions.changeFormInput({ update })),
})

export const MoreOptionsModal = connect<Props, OP, {||}, DP, _, _>(
  null,
  mapDispatchToProps
)(MoreOptionsModalComponent)
