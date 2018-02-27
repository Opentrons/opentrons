// @flow
import * as React from 'react'
import {
  OutlineButton,
  FormGroup,
  InputField,
  DropdownField,
  Modal
} from '@opentrons/components'

import styles from './NewFileModal.css'
import modalStyles from './modal.css'

type State = {
  name?: string,
  leftPipette?: string, // TODO: make this union of pipette option values
  rightPipette?: string,
}

type Props = {
  onCancel: () => mixed,
  onSave: State => mixed
}

const pipetteOptions = [ // TODO: standardize pipette values
  {name: 'None', value: ''},
  {name: 'P10 Single-Channel', value: 'p10-single'},
  {name: 'P10 8-Channel', value: 'p10-8channel'},
  {name: 'P300 Single-Channel', value: 'p300-single'},
  {name: 'P300 8-Channel', value: 'p300-8channel'}
]

// 'invalid' state is just a concern of these dropdowns, not selected pipette state in general
const INVALID = 'INVALID'

const pipetteOptionsWithInvalid = [{name: '', value: INVALID}, ...pipetteOptions]

export default class NewFileModal extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      name: '',
      leftPipette: INVALID,
      rightPipette: INVALID
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
    const {name, leftPipette, rightPipette} = this.state
    const canSubmit = (leftPipette !== INVALID && rightPipette !== INVALID) && // neither can be invalid
      (leftPipette || rightPipette) // at least one must not be none (empty string)

    // NOTE Ian 2018-02-27: This is similar to but not quite the same as ContinueModal in complib
    return <Modal className={modalStyles.modal}>
      <div className={modalStyles.modal_contents}>
        <h2>Create New Protocol</h2>

        <FormGroup label='Protocol Name:'>
          <InputField placeholder='untitled' value={name} onChange={this.handleChange('name')} />
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

        <div className={styles.cancel_continue_button_row}>
          <OutlineButton onClick={this.props.onCancel}>Cancel</OutlineButton>
          <OutlineButton onClick={this.handleSubmit} disabled={!canSubmit}>Save</OutlineButton>
        </div>
      </div>
    </Modal>
  }
}
