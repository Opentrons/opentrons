// @flow
import * as React from 'react'
import cx from 'classnames'
import {
  AlertModal,
  DropdownField,
  FormGroup,
  InputField
} from '@opentrons/components'
import {pipetteOptions} from '../../../pipettes/pipetteData'
import PipetteDiagram from './PipetteDiagram'
import TiprackDiagram from './TiprackDiagram'
import styles from './NewFileModal.css'
import formStyles from '../../forms.css'
import modalStyles from '../modal.css'

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
  {name: '10 μL', value: 'tiprack-10ul'},
  {name: '200 μL', value: 'tiprack-200ul'},
  {name: '1000 μL', value: 'tiprack-1000ul'},
  {name: '1000 μL Chem', value: 'tiprack-1000ul-chem'}
  // {name: '300 μL', value: 'GEB-tiprack-300ul'} // NOTE this is not supported by Python API yet
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
    // skip tiprack update if no pipette selected
    if (accessor === 'leftTiprackModel' && !this.state.leftPipette) return
    if (accessor === 'rightTiprackModel' && !this.state.rightPipette) return

    const value: string = e.target.value

    const nextState: {[$Keys<State>]: mixed} = {
      [accessor]: value
    }

    // clear tiprack selection if corresponding pipette model is deselected
    if (accessor === 'leftPipette' && !value) {
      nextState.leftTiprackModel = null
    } else if (accessor === 'rightPipette' && !value) {
      nextState.rightTiprackModel = null
    }

    this.setState({
      ...this.state,
      ...nextState
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

    const pipetteFields = [
      ['leftPipette', 'Left Pipette'],
      ['rightPipette', 'Right Pipette']
    ].map(([name, label]) => {
      const value = this.state[name]
      return (
        <FormGroup key={name} label={`${label}*:`} className={formStyles.column_1_2}>
          <DropdownField options={value === USER_HAS_NOT_SELECTED
              ? pipetteOptionsWithInvalid
              : pipetteOptionsWithNone}
            value={value}
            onChange={this.handleChange(name)} />
        </FormGroup>
      )
    })

    const tiprackFields = ['leftTiprackModel', 'rightTiprackModel'].map(name => (
      <FormGroup key={name} label='Tip rack*:' className={formStyles.column_1_2}>
        <DropdownField options={tiprackOptions}
          value={this.state[name]}
          onChange={this.handleChange(name)} />
        </FormGroup>
    ))

    return <AlertModal className={cx(modalStyles.modal, styles.new_file_modal)}
      buttons={[
        {onClick: this.props.onCancel, children: 'Cancel'},
        {onClick: this.handleSubmit, disabled: !canSubmit, children: 'Save'}
      ]}>
      <form className={modalStyles.modal_contents}>
        <h2>Create New Protocol</h2>

        <FormGroup label='Name:'>
          <InputField placeholder='Untitled'
            value={name}
            onChange={this.handleChange('name')}
          />
        </FormGroup>

        <h3>Beta Pipette Restrictions:</h3>
        <ol>
          <li>
            You can't change your pipette selection later. If in doubt go for
            smaller pipettes. The Protocol Designer automatically breaks up transfer
            volumes that exceed pipette capacity into multiple transfers.
          </li>
          <li>
            Pipettes can't share tip racks. There needs to be at least 1 tip rack per
            pipette on the deck.
          </li>
        </ol>

        <div className={formStyles.row_wrapper}>
          {pipetteFields}
        </div>

        <div className={formStyles.row_wrapper}>
          {tiprackFields}
        </div>

        <div className={styles.diagrams}>
          <TiprackDiagram containerType={this.state.leftTiprackModel} />
          <PipetteDiagram
            leftPipette={this.state.leftPipette}
            rightPipette={this.state.rightPipette}
          />
          <TiprackDiagram containerType={this.state.rightTiprackModel} />
        </div>
      </form>
    </AlertModal>
  }
}
