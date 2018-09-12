// @flow
import * as React from 'react'
import cx from 'classnames'
import {
  AlertModal,
  DropdownField,
  FormGroup,
  InputField,
  type Mount,
} from '@opentrons/components'
import startCase from 'lodash/startCase'
import isEmpty from 'lodash/isEmpty'
import {pipetteOptions} from '../../../pipettes/pipetteData'
import PipetteDiagram from './PipetteDiagram'
import TiprackDiagram from './TiprackDiagram'
import styles from './NewFileModal.css'
import modalStyles from '../modal.css'
import type {NewProtocolFields, PipetteFields} from '../../../load-file'

type State = NewProtocolFields

type Props = {
  hideModal: boolean,
  onCancel: () => mixed,
  onSave: (NewProtocolFields) => mixed,
}

// 'USER_HAS_NOT_SELECTED' state is just a concern of these dropdowns,
// not selected pipette state in general
// It's needed b/c user must select 'None' explicitly,
// they cannot just leave the dropdown blank.
const USER_HAS_NOT_SELECTED = 'USER_HAS_NOT_SELECTED'
// TODO: Ian 2018-06-22 use pristinity instead of this?

const pipetteOptionsWithNone = [
  {name: 'None', value: ''},
  ...pipetteOptions,
]

const pipetteOptionsWithInvalid = [
  {name: '', value: USER_HAS_NOT_SELECTED},
  ...pipetteOptionsWithNone,
]

// TODO: Ian 2018-06-22 get this programatically from shared-data labware defs
// and exclude options that are incompatible with pipette
// and also auto-select tiprack if there's only one compatible tiprack for a pipette
const tiprackOptions = [
  {name: '10 μL', value: 'tiprack-10ul'},
  {name: '200 μL', value: 'tiprack-200ul'},
  {name: '1000 μL', value: 'tiprack-1000ul'},
  {name: '1000 μL Chem', value: 'tiprack-1000ul-chem'},
  // {name: '300 μL', value: 'GEB-tiprack-300ul'} // NOTE this is not supported by Python API yet
]

const initialState = {
  name: '',
  left: {pipetteModel: USER_HAS_NOT_SELECTED, tiprackModel: null},
  right: {pipetteModel: USER_HAS_NOT_SELECTED, tiprackModel: null},
}

export default class NewFileModal extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = initialState
  }

  // TODO(mc, 2018-07-24): use a different lifecycle hook
  componentWillReceiveProps (nextProps: Props) {
    // reset form state when modal is hidden
    if (!this.props.hideModal && nextProps.hideModal) this.setState(initialState)
  }

  makeHandleMountFieldChange = (mount: Mount, fieldName: $Keys<PipetteFields>) => (e: SyntheticInputEvent<*>) => {
    const value: string = e.target.value
    let nextMountState = {[fieldName]: value}
    if (fieldName === 'pipetteModel') nextMountState = {...nextMountState, tiprackModel: null}
    this.setState({[mount]: {...this.state[mount], ...nextMountState}})
  }
  handleNameChange = (e: SyntheticInputEvent<*>) => this.setState({name: e.target.value})

  handleSubmit = () => { this.props.onSave(this.state) }

  render () {
    if (this.props.hideModal) return null

    const {name, left, right} = this.state

    const pipetteSelectionIsValid = (
      // neither can be invalid
      (left.pipetteModel !== USER_HAS_NOT_SELECTED && right.pipetteModel !== USER_HAS_NOT_SELECTED) &&
      // at least one must not be none (empty string)
      (left.pipetteModel || right.pipetteModel)
    )

    // if pipette selected, corresponding tiprack type also selected
    const tiprackSelectionIsValid = (
      (left.pipetteModel ? Boolean(left.tiprackModel) : true) &&
      (right.pipetteModel ? Boolean(right.tiprackModel) : true)
    )

    const canSubmit = pipetteSelectionIsValid && tiprackSelectionIsValid

    return (
      <AlertModal
        className={cx(modalStyles.modal, styles.new_file_modal)}
        buttons={[
          {onClick: this.props.onCancel, children: 'Cancel'},
          {onClick: this.handleSubmit, disabled: !canSubmit, children: 'Save'},
        ]}>
        <form className={modalStyles.modal_contents}>
          <h2>Create New Protocol</h2>

          <FormGroup label='Name:'>
            <InputField placeholder='Untitled' value={name} onChange={this.handleNameChange} />
          </FormGroup>
          <BetaRestrictions />

          <div className={styles.mount_fields_row}>
            <MountFields mount="left" values={this.state.left} makeOnChange={this.makeHandleMountFieldChange} />
            <MountFields mount="right" values={this.state.right} makeOnChange={this.makeHandleMountFieldChange} />
          </div>

          <div className={styles.diagrams}>
            <TiprackDiagram containerType={this.state.left.tiprackModel} />
            <PipetteDiagram
              leftPipette={this.state.left.pipetteModel}
              rightPipette={this.state.right.pipetteModel}
            />
            <TiprackDiagram containerType={this.state.right.tiprackModel} />
          </div>
        </form>
      </AlertModal>
    )
  }
}

type MountFieldsProps = {
  mount: Mount,
  values: {pipetteModel: string, tiprackModel: ?string},
  makeOnChange: (mount: Mount, fieldName: $Keys<PipetteFields>) => (SyntheticInputEvent<*>) => void,
}
const MountFields = (props: MountFieldsProps) => (
  <div className={styles.mount_column}>
    <FormGroup key={`${props.mount}PipetteModel`} label={`${startCase(props.mount)} Pipette*`}>
      <DropdownField
        options={props.values.pipetteModel === USER_HAS_NOT_SELECTED ? pipetteOptionsWithInvalid : pipetteOptionsWithNone}
        value={props.values.pipetteModel}
        onChange={props.makeOnChange(props.mount, 'pipetteModel')} />
    </FormGroup>

    <FormGroup disabled={isEmpty(props.values.pipetteModel)} key={`${props.mount}TiprackModel`} label={`${startCase(props.mount)} Tiprack*`}>
      <DropdownField
        disabled={isEmpty(props.values.pipetteModel)}
        options={tiprackOptions}
        value={props.values.tiprackModel}
        onChange={props.makeOnChange(props.mount, 'tiprackModel')} />
    </FormGroup>
  </div>
)

const BetaRestrictions = () => (
  <React.Fragment>
    <h3>Beta Pipette Restrictions:</h3>
    <ol>
      <li>
        You can&apos;t change your pipette selection later. If in doubt go for
        smaller pipettes. The Protocol Designer automatically breaks up transfer
        volumes that exceed pipette capacity into multiple transfers.
      </li>
      <li>
        Pipettes can&apos;t share tip racks. There needs to be at least 1 tip rack per
        pipette on the deck.
      </li>
    </ol>
  </React.Fragment>
)
