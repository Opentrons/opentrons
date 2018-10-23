// @flow
import * as React from 'react'
import cx from 'classnames'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'

import {AlertModal, DropdownField, FormGroup, type Mount} from '@opentrons/components'
import startCase from 'lodash/startCase'
import isEmpty from 'lodash/isEmpty'

import i18n from '../../localization'
import type {BaseState} from '../../types'
import {pipetteOptions} from '../../pipettes/pipetteData'
import {actions as pipetteActions, selectors as pipetteSelectors} from '../../pipettes'

import PipetteDiagram from './NewFileModal/PipetteDiagram'
import TiprackDiagram from './NewFileModal/TiprackDiagram'
import styles from './NewFileModal/NewFileModal.css'
import modalStyles from './modal.css'
import type {NewProtocolFields, PipetteFields} from '../../load-file'

type State = NewProtocolFields

type Props = {
  onCancel: () => mixed,
  onSave: (NewProtocolFields) => mixed,
  closeModal: () => void,
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

// TODO: Ian 2018-06-22 get this programatically from shared-data labware defs
// and exclude options that are incompatible with pipette
// and also auto-select tiprack if there's only one compatible tiprack for a pipette
const tiprackOptions = [
  {name: '10 μL', value: 'tiprack-10ul'},
  {name: '300 μL', value: 'opentrons-tiprack-300ul'},
  {name: '1000 μL', value: 'tiprack-1000ul'},
  {name: '1000 μL Chem', value: 'tiprack-1000ul-chem'},
  // {name: '300 μL', value: 'GEB-tiprack-300ul'} // NOTE this is not supported by Python API yet
]

const DEFAULT_SELECTION = {pipetteModel: USER_HAS_NOT_SELECTED, tiprackModel: null}

const pipetteDataToFormState = (pipetteData) => ({
  pipetteModel: pipetteData.model,
  tiprackModel: pipetteData.tiprack.model,
})

class EditPipettesModal extends React.Component<Props, State> {
  constructor (props) {
    super(props)
    const {instruments} = props
    this.state = {
      left: instruments.left ? pipetteDataToFormState(instruments.left) : DEFAULT_SELECTION,
      right: instruments.right ? pipetteDataToFormState(instruments.right) : DEFAULT_SELECTION,
    }
  }

  makeHandleMountChange = (mount: Mount, fieldName: $Keys<PipetteFields>) => (e: SyntheticInputEvent<*>) => {
    const value: string = e.target.value
    let nextMountState = {[fieldName]: value}
    if (fieldName === 'pipetteModel') nextMountState = {...nextMountState, tiprackModel: null}
    this.setState({[mount]: {...this.state[mount], ...nextMountState}})
  }
  handleNameChange = (e: SyntheticInputEvent<*>) => this.setState({name: e.target.value})

  handleSubmit = () => {
    this.props.onSave(this.state)
    this.props.closeModal()
  }

  handleCancel = () => {
    this.props.onCancel()
    this.props.closeModal()
  }

  render () {
    const {left, right} = this.state

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
          {onClick: this.handleCancel, children: 'Cancel', tabIndex: 7},
          {onClick: this.handleSubmit, disabled: !canSubmit, children: 'Save', tabIndex: 6},
        ]}>
        <form
          className={modalStyles.modal_contents}
          onSubmit={() => { canSubmit && this.handleSubmit() }}>
          <h2>Edit Pipettes</h2>

          <div className={styles.mount_fields_row}>
            <div className={styles.mount_column}>
              <FormGroup key="leftPipetteModel" label="Left Pipette">
                <DropdownField
                  tabIndex={2}
                  options={pipetteOptionsWithNone}
                  value={this.state.left.pipetteModel}
                  onChange={this.makeHandleMountChange('left', 'pipetteModel')} />
              </FormGroup>
              <FormGroup disabled={isEmpty(this.state.left.pipetteModel)} key={'leftTiprackModel'} label={`${startCase('left')} Tiprack*`}>
                <DropdownField
                  tabIndex={3}
                  disabled={isEmpty(this.state.left.pipetteModel)}
                  options={tiprackOptions}
                  value={this.state.left.tiprackModel}
                  onChange={this.makeHandleMountChange('left', 'tiprackModel')} />
              </FormGroup>
            </div>
            <div className={styles.mount_column}>
              <FormGroup key="rightPipetteModel" label="Right Pipette">
                <DropdownField
                  tabIndex={4}
                  options={pipetteOptionsWithNone}
                  value={this.state.right.pipetteModel}
                  onChange={this.makeHandleMountChange('right', 'pipetteModel')} />
              </FormGroup>
              <FormGroup disabled={isEmpty(this.state.right.pipetteModel)} key={'rightTiprackModel'} label={`${startCase('right')} Tiprack*`}>
                <DropdownField
                  tabIndex={5}
                  disabled={isEmpty(this.state.right.pipetteModel)}
                  options={tiprackOptions}
                  value={this.state.right.tiprackModel}
                  onChange={this.makeHandleMountChange('right', 'tiprackModel')} />
              </FormGroup>
            </div>
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

const mapSTP = (state: BaseState): SP => {
  const pipetteData = pipetteSelectors.pipettesForInstrumentGroup(state)
  return {
    instruments: {
      left: pipetteData.find(i => i.mount === 'left'),
      right: pipetteData.find(i => i.mount === 'right'),
    },
  }
}

const mapDTP = (dispatch: Dispatch): DP => ({
  onSave: (fields) => {
    // TODO: only launch if changes protocol
    if (window.confirm(i18n.t('alert.window.confirm_create_new'))) {
      dispatch(pipetteActions.editPipette(fields))
    }
  },
  onCancel: () => console.log('tried to Cancel'),
})

export default connect(mapSTP, mapDTP)(EditPipettesModal)
