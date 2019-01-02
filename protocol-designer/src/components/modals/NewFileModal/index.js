// @flow
import * as React from 'react'
import cx from 'classnames'
import {
  Modal,
  DropdownField,
  FormGroup,
  InputField,
  OutlineButton,
  type Mount,
} from '@opentrons/components'
import startCase from 'lodash/startCase'
import isEmpty from 'lodash/isEmpty'
import i18n from '../../../localization'
import {pipetteOptions} from '../../../pipettes/pipetteData'
import PipetteDiagram from './PipetteDiagram'
import TiprackDiagram from './TiprackDiagram'
import styles from './NewFileModal.css'
import formStyles from '../../forms.css'
import modalStyles from '../modal.css'
import type {NewProtocolFields, PipetteFields} from '../../../load-file'

type State = NewProtocolFields

type Props = {
  hideModal: boolean,
  onCancel: () => mixed,
  onSave: (NewProtocolFields) => mixed,
}

const pipetteOptionsWithNone = [
  {name: 'None', value: ''},
  ...pipetteOptions,
]

// TODO: Ian 2018-06-22 get this programatically from shared-data labware defs
// and exclude options that are incompatible with pipette
// and also auto-select tiprack if there's only one compatible tiprack for a pipette
const tiprackOptions = [
  {name: '10 μL', value: 'tiprack-10ul'},
  {name: '200 μL', value: 'tiprack-200ul'},
  {name: '300 μL', value: 'opentrons-tiprack-300ul'},
  {name: '1000 μL', value: 'tiprack-1000ul'},
]

const initialState = {
  name: '',
  left: {pipetteModel: '', tiprackModel: null},
  right: {pipetteModel: '', tiprackModel: null},
}

// TODO: BC 2018-11-06 there is a lot of copy pasta between this component and the edit pipettes modal, lets consolidate
export default class NewFileModal extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = initialState
  }

  componentDidUpdate (prevProps: Props) {
    // reset form state when modal is hidden
    if (!prevProps.hideModal && this.props.hideModal) this.setState(initialState)
  }

  makeHandleMountChange = (mount: Mount, fieldName: $Keys<PipetteFields>) => (e: SyntheticInputEvent<*>) => {
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
      <Modal
        contentsClassName={styles.new_file_modal_contents}
        className={cx(modalStyles.modal, styles.new_file_modal)}>
        <form onSubmit={() => { canSubmit && this.handleSubmit() }}>
          <h2 className={styles.new_file_modal_title}>Create New Protocol</h2>
          <FormGroup className={formStyles.stacked_row} label='Name:'>
            <InputField
              autoFocus
              tabIndex={1}
              placeholder='Untitled'
              value={name}
              onChange={this.handleNameChange} />
          </FormGroup>

          <div className={styles.mount_fields_row}>
            <div className={styles.mount_column}>
              <FormGroup key="leftPipetteModel" label="Left Pipette" className={formStyles.stacked_row}>
                <DropdownField
                  tabIndex={2}
                  options={pipetteOptionsWithNone}
                  value={this.state.left.pipetteModel}
                  onChange={this.makeHandleMountChange('left', 'pipetteModel')} />
              </FormGroup>
              <FormGroup
                disabled={isEmpty(this.state.left.pipetteModel)}
                key={'leftTiprackModel'}
                label={`${startCase('left')} Tiprack*`}
                className={formStyles.stacked_row}>
                <DropdownField
                  tabIndex={3}
                  disabled={isEmpty(this.state.left.pipetteModel)}
                  options={tiprackOptions}
                  value={this.state.left.tiprackModel}
                  onChange={this.makeHandleMountChange('left', 'tiprackModel')} />
              </FormGroup>
            </div>
            <div className={styles.mount_column}>
              <FormGroup key="rightPipetteModel" label="Right Pipette" className={formStyles.stacked_row}>
                <DropdownField
                  tabIndex={4}
                  options={pipetteOptionsWithNone}
                  value={this.state.right.pipetteModel}
                  onChange={this.makeHandleMountChange('right', 'pipetteModel')} />
              </FormGroup>
              <FormGroup
                disabled={isEmpty(this.state.right.pipetteModel)}
                key={'rightTiprackModel'}
                label={`${startCase('right')} Tiprack*`}
                className={formStyles.stacked_row}>
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
        <div className={styles.button_row}>
          <OutlineButton
            onClick={this.props.onCancel}
            tabIndex={7}
            className={styles.button}>
            {i18n.t('button.cancel')}
          </OutlineButton>
          <OutlineButton
            onClick={this.handleSubmit}
            disabled={!canSubmit}
            tabIndex={6}
            className={styles.button}>
            {i18n.t('button.save')}
          </OutlineButton>
        </div>
      </Modal>
    )
  }
}
