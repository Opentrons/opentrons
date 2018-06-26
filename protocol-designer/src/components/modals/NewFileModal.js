// @flow
import * as React from 'react'
import {
  FormGroup,
  InputField,
  DropdownField,
  AlertModal
} from '@opentrons/components'
import {pipetteOptions} from '../../pipettes/pipetteData'

import styles from './NewFileModal.css'
import formStyles from '../forms.css'
import modalStyles from './modal.css'

type State = {
  name: string,

  // TODO: make this union of pipette option values
  leftPipette: string,
  rightPipette: string,

  // TODO: Ian 2018-06-22 type as labware-type enums of tipracks
  leftTiprackModel: ?string,
  rightTiprackModel: ?string
}

type Props = {
  hideModal: boolean,
  onCancel: () => mixed,
  onSave: State => mixed
}

// 'USER_HAS_NOT_SELECTED' state is just a concern of these dropdowns,
// not selected pipette state in general
// It's needed b/c user must select 'None' explicitly,
// they cannot just leave the dropdown blank.
const USER_HAS_NOT_SELECTED = 'USER_HAS_NOT_SELECTED'
// TODO: Ian 2018-06-22 use pristinity instead of this?

const pipetteOptionsWithNone = [
  {name: 'None', value: ''},
  ...pipetteOptions
]

const pipetteOptionsWithInvalid = [
  {name: '', value: USER_HAS_NOT_SELECTED},
  ...pipetteOptionsWithNone
]

// TODO: Ian 2018-06-22 get this programatically from shared-data labware defs
// and exclude options that are incompatible with pipette
// and also auto-select tiprack if there's only one compatible tiprack for a pipette
const tiprackOptions = [
  {name: '10 uL', value: 'tiprack-10ul'},
  {name: '200 uL', value: 'tiprack-200ul'},
  {name: '1000 uL', value: 'tiprack-1000ul'},
  {name: '1000 uL Chem', value: 'tiprack-1000ul-chem'}
  // {name: '300 uL', value: 'GEB-tiprack-300ul'} // NOTE this is not supported by Python API yet
]

const initialState = {
  name: '',
  leftPipette: USER_HAS_NOT_SELECTED,
  rightPipette: USER_HAS_NOT_SELECTED,
  leftTiprackModel: null,
  rightTiprackModel: null
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

    const update: {[$Keys<State>]: mixed} = {
      [accessor]: value
    }

    // clear tiprack selection if corresponding pipette model is deselected
    if (accessor === 'leftPipette' && !value) {
      update.leftTiprackModel = null
    } else if (accessor === 'rightPipette' && !value) {
      update.rightTiprackModel = null
    }

    // skip tiprack update if no pipette selected
    if (accessor === 'leftTiprackModel' && !this.state.leftPipette) return
    if (accessor === 'rightTiprackModel' && !this.state.rightPipette) return

    this.setState({
      ...this.state,
      ...update
    })
  }

  handleSubmit = () => {
    this.props.onSave(this.state)
  }

  render () {
    if (this.props.hideModal) {
      return null
    }

    const {
      name,
      leftPipette,
      rightPipette,
      leftTiprackModel,
      rightTiprackModel
    } = this.state

    const pipetteSelectionIsValid = (
      // neither can be invalid
      (leftPipette !== USER_HAS_NOT_SELECTED && rightPipette !== USER_HAS_NOT_SELECTED) &&
      // at least one must not be none (empty string)
      (leftPipette || rightPipette)
    )

    // if pipette selected, corresponding tiprack type also selected
    const tiprackSelectionIsValid = (
      (leftPipette ? Boolean(leftTiprackModel) : true) &&
      (rightPipette ? Boolean(rightTiprackModel) : true)
    )

    const canSubmit = pipetteSelectionIsValid && tiprackSelectionIsValid

    return <AlertModal className={modalStyles.modal}
      buttons={[
        {onClick: this.props.onCancel, children: 'Cancel'},
        {onClick: this.handleSubmit, disabled: !canSubmit, children: 'Save'}
      ]}>
      <form className={modalStyles.modal_contents}>
        <h2>Create New Protocol</h2>

        <FormGroup label='Protocol Name:'>
          <InputField placeholder='Untitled'
            value={name}
            onChange={this.handleChange('name')}
          />
        </FormGroup>

        <div className={styles.pipette_text}>
          Select the pipettes you will be using. This cannot be changed later.
        </div>

        <div className={formStyles.row_wrapper}>
          {[
            ['leftPipette', 'Left Pipette'],
            ['rightPipette', 'Right Pipette']
          ].map(([stateField, label]) => {
            const fieldValue = this.state[stateField]
            return (
              <FormGroup key={stateField} label={`${label}*:`} className={formStyles.column_1_2}>
                <DropdownField options={fieldValue === USER_HAS_NOT_SELECTED
                    ? pipetteOptionsWithInvalid
                    : pipetteOptionsWithNone}
                  value={fieldValue} onChange={this.handleChange(stateField)} />
              </FormGroup>
            )
          })}
        </div>

        <div className={formStyles.row_wrapper}>
          {['leftTiprackModel', 'rightTiprackModel'].map(stateField => (
            <FormGroup key={stateField} label='Tip rack*:' className={formStyles.column_1_2}>
              <DropdownField options={tiprackOptions}
                value={this.state[stateField]}
                onChange={this.handleChange(stateField)} />
              </FormGroup>
          ))}
        </div>
      </form>
    </AlertModal>
  }
}
