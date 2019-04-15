// @flow
import * as React from 'react'
import cx from 'classnames'
import assert from 'assert'
import {
  Modal,
  FormGroup,
  InputField,
  OutlineButton,
  type Mount,
} from '@opentrons/components'
import reduce from 'lodash/reduce'
import i18n from '../../../localization'
import styles from './FilePipettesModal.css'
import formStyles from '../../forms/forms.css'
import modalStyles from '../modal.css'
import StepChangesConfirmModal from '../EditPipettesModal/StepChangesConfirmModal'
import PipetteFields from './PipetteFields'

import type { NewProtocolFields } from '../../../load-file'
import type {
  PipetteOnDeck,
  FormPipette,
  FormPipettesByMount,
} from '../../../step-forms'

type PipetteOnDeckNoId = $Diff<PipetteOnDeck, { id: *, spec: * }>

type State = {
  fields: NewProtocolFields,
  pipettesByMount: FormPipettesByMount,
  showEditPipetteConfirmation: boolean,
}

type Props = {
  useProtocolFields?: ?boolean,
  hideModal?: boolean,
  onCancel: () => mixed,
  initialPipetteValues?: $PropertyType<State, 'pipettesByMount'>,
  onSave: ({
    newProtocolFields: NewProtocolFields,
    pipettes: Array<PipetteOnDeckNoId>,
  }) => mixed,
}

const initialState = {
  fields: { name: '' },
  showEditPipetteConfirmation: false,
  pipettesByMount: {
    left: { pipetteName: '', tiprackModel: null },
    right: { pipetteName: '', tiprackModel: null },
  },
}

// TODO: Ian 2019-03-15 use i18n for labels
export default class FilePipettesModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      ...initialState,
      pipettesByMount: {
        ...initialState.pipettesByMount,
        ...(props.initialPipetteValues || {}),
      },
    }
  }

  componentDidUpdate(prevProps: Props) {
    // reset form state when modal is hidden
    if (!prevProps.hideModal && this.props.hideModal)
      this.setState(initialState)
  }

  handlePipetteFieldsChange = (e: SyntheticInputEvent<*>) => {
    const value: string = e.currentTarget.value
    if (!e.currentTarget.name) {
      console.error(
        'handlePipetteFieldsChange expected nested field name, got no name with value:',
        e.currentTarget.value
      )
      return
    }
    const splitFieldName: [Mount, string] = e.currentTarget.name.split('.')
    const mount = splitFieldName[0]
    const fieldName = splitFieldName[1]
    let nextMountState = { [fieldName]: value }
    if (fieldName === 'pipetteName')
      nextMountState = { ...nextMountState, tiprackModel: null }
    this.setState({
      pipettesByMount: {
        ...this.state.pipettesByMount,
        [mount]: {
          ...this.state.pipettesByMount[mount],
          ...nextMountState,
        },
      },
    })
  }

  handleNameChange = (e: SyntheticInputEvent<*>) =>
    this.setState({ fields: { ...this.state.fields, name: e.target.value } })

  handleSubmit = () => {
    const newProtocolFields = this.state.fields
    const pipettes = reduce(
      this.state.pipettesByMount,
      (acc, formPipette: FormPipette, mount): Array<PipetteOnDeckNoId> => {
        assert(mount === 'left' || mount === 'right', `invalid mount: ${mount}`) // this is mostly for flow
        return formPipette &&
          formPipette.pipetteName &&
          formPipette.tiprackModel &&
          (mount === 'left' || mount === 'right')
          ? [
              ...acc,
              {
                mount,
                name: formPipette.pipetteName,
                tiprackModel: formPipette.tiprackModel,
              },
            ]
          : acc
      },
      []
    )
    this.props.onSave({ pipettes, newProtocolFields })
  }

  showEditPipetteConfirmationModal = () => {
    this.setState({ showEditPipetteConfirmation: true })
  }

  handleCancel = () => {
    this.setState({ showEditPipetteConfirmation: false })
  }

  render() {
    if (this.props.hideModal) return null
    const { useProtocolFields } = this.props

    const { name } = this.state.fields
    const { left, right } = this.state.pipettesByMount

    const pipetteSelectionIsValid =
      // at least one must not be none (empty string)
      left.pipetteName || right.pipetteName

    // if pipette selected, corresponding tiprack type also selected
    const tiprackSelectionIsValid =
      (left.pipetteName ? Boolean(left.tiprackModel) : true) &&
      (right.pipetteName ? Boolean(right.tiprackModel) : true)

    const canSubmit = pipetteSelectionIsValid && tiprackSelectionIsValid

    return (
      <React.Fragment>
        <Modal
          contentsClassName={styles.new_file_modal_contents}
          className={cx(modalStyles.modal, styles.new_file_modal)}
        >
          <form
            onSubmit={() => {
              canSubmit && this.handleSubmit()
            }}
          >
            <h2 className={styles.new_file_modal_title}>
              {useProtocolFields
                ? i18n.t('modal.new_protocol.title')
                : i18n.t('modal.edit_pipettes.title')}
            </h2>

            {useProtocolFields && (
              <FormGroup className={formStyles.stacked_row} label="Name">
                <InputField
                  autoFocus
                  tabIndex={1}
                  placeholder={i18n.t('form.generic.default_protocol_name')}
                  value={name}
                  onChange={this.handleNameChange}
                />
              </FormGroup>
            )}

            <PipetteFields
              initialTabIndex={1}
              values={this.state.pipettesByMount}
              handleChange={this.handlePipetteFieldsChange}
            />
          </form>
          <div className={styles.button_row}>
            <OutlineButton
              onClick={this.props.onCancel}
              tabIndex={7}
              className={styles.button}
            >
              {i18n.t('button.cancel')}
            </OutlineButton>
            <OutlineButton
              onClick={
                useProtocolFields
                  ? this.handleSubmit
                  : this.showEditPipetteConfirmationModal
              }
              disabled={!canSubmit}
              tabIndex={6}
              className={styles.button}
            >
              {i18n.t('button.save')}
            </OutlineButton>
          </div>
        </Modal>
        {this.state.showEditPipetteConfirmation && (
          <StepChangesConfirmModal
            onCancel={this.handleCancel}
            onConfirm={this.handleSubmit}
          />
        )}
      </React.Fragment>
    )
  }
}
