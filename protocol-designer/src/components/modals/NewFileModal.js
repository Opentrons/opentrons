// @flow
import * as React from 'react'
import {
  FormGroup,
  InputField,
  DropdownField,
  AlertModal
} from '@opentrons/components'
import {pipetteData} from '../../file-data'

import styles from './NewFileModal.css'
import modalStyles from './modal.css'

type State = {
  name?: string,
  leftPipette?: string, // TODO: make this union of pipette option values
  rightPipette?: string,
}

type Props = {
  hideModal: boolean,
  onCancel: () => mixed,
  onSave: State => mixed
}

// 'invalid' state is just a concern of these dropdowns, not selected pipette state in general
const INVALID = 'INVALID'

const pipetteOptionsWithInvalid = [
  {name: '', value: INVALID},
  {name: 'None', value: ''},
  ...pipetteData.pipetteOptions
]

const initialState = {
  name: '',
  leftPipette: INVALID,
  rightPipette: INVALID
}

export default class NewFileModal extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = initialState
  }

  componentWillReceiveProps (nextProps: Props) {
    // reset form state when modal is hidden
    if (!this.props.hideModal && nextProps.hideModal) {
      this.setState(initialState)
    }
  }

  handleChange = (accessor: $Keys<State>) => (e: SyntheticInputEvent<*>) => {
    const value: string = e.target.value
    this.setState({
      ...this.state,
      [accessor]: value
    })
  }

  handleSubmit = () => {
    this.props.onSave(this.state)
  }

  render () {
    if (this.props.hideModal) {
      return null
    }

    const {name, leftPipette, rightPipette} = this.state
    const canSubmit = (leftPipette !== INVALID && rightPipette !== INVALID) && // neither can be invalid
      (leftPipette || rightPipette) // at least one must not be none (empty string)

    return <AlertModal className={modalStyles.modal}
      buttons={[
        {onClick: this.props.onCancel, children: 'Cancel'},
        {onClick: this.handleSubmit, disabled: !canSubmit, children: 'Save'}
      ]}>
      <form className={modalStyles.modal_contents}>
        <h2>Create New Protocol</h2>

        <FormGroup label='Protocol Name:'>
          <InputField placeholder='Untitled' value={name} onChange={this.handleChange('name')} />
        </FormGroup>

        <div className={styles.pipette_text}>
          Select the pipettes you will be using. This cannot be changed later.
        </div>

        <div className={styles.row_wrapper}>
          <FormGroup label='Left pipette*:' className={styles.column_1_2}>
            <DropdownField options={pipetteOptionsWithInvalid}
              value={leftPipette} onChange={this.handleChange('leftPipette')} />
          </FormGroup>
          <FormGroup label='Right pipette*:' className={styles.column_1_2}>
            <DropdownField options={pipetteOptionsWithInvalid}
              value={rightPipette} onChange={this.handleChange('rightPipette')} />
          </FormGroup>
        </div>
      </form>
    </AlertModal>
  }
}
