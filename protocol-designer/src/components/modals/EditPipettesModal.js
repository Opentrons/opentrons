// @flow
import * as React from 'react'
import cx from 'classnames'
import {connect} from 'react-redux'

import {
  AlertModal,
  DropdownField,
  FormGroup,
  OutlineButton,
  type Mount,
} from '@opentrons/components'
import startCase from 'lodash/startCase'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'

import type {PipetteData} from '../../step-generation'
import i18n from '../../localization'
import type {BaseState, ThunkDispatch} from '../../types'
import {pipetteOptions} from '../../pipettes/pipetteData'
import {
  thunks as pipetteThunks,
  selectors as pipetteSelectors,
  type EditPipettesFields,
} from '../../pipettes'

import PipetteDiagram from './NewFileModal/PipetteDiagram'
import TiprackDiagram from './NewFileModal/TiprackDiagram'
import styles from './NewFileModal/NewFileModal.css'
import modalStyles from './modal.css'
import type {PipetteFields} from '../../load-file'

type State = EditPipettesFields & {isWarningModalOpen: boolean}

type SP = {
  instruments: {
    left: ?PipetteData,
    right: ?PipetteData,
  },
}

type DP = {
  onCancel: () => mixed,
  onSave: (State) => mixed,
}

type Props = {closeModal: () => void} & SP & DP

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

const DEFAULT_SELECTION = {pipetteModel: '', tiprackModel: null}

const pipetteDataToFormState = (pipetteData) => ({
  pipetteModel: pipetteData ? pipetteData.model : '',
  tiprackModel: (pipetteData && pipetteData.tiprack) ? pipetteData.tiprack.model : null,
})

class EditPipettesModal extends React.Component<Props, State> {
  constructor (props) {
    super(props)
    const {instruments} = props
    this.state = {
      left: instruments.left ? pipetteDataToFormState(instruments.left) : DEFAULT_SELECTION,
      right: instruments.right ? pipetteDataToFormState(instruments.right) : DEFAULT_SELECTION,
      isWarningModalOpen: false,
    }
  }

  makeHandleMountChange = (mount: Mount, fieldName: $Keys<PipetteFields>) => (e: SyntheticInputEvent<*>) => {
    const value: string = e.target.value
    let nextMountState = {[fieldName]: value}
    if (fieldName === 'pipetteModel') nextMountState = {...nextMountState, tiprackModel: null}
    this.setState({[mount]: {...this.state[mount], ...nextMountState}})
  }

  handleSubmit = () => {
    const {instruments} = this.props
    const {left, right} = this.state
    const leftChanged = !isEqual(pipetteDataToFormState(instruments.left), left)
    const rightChanged = !isEqual(pipetteDataToFormState(instruments.right), right)
    if (leftChanged || rightChanged) {
      this.setState({isWarningModalOpen: true})
    } else {
      this.savePipettes()
    }
  }

  savePipettes = () => {
    const {left, right} = this.state
    this.props.onSave({left, right})
    this.props.closeModal()
  }

  handleCancel = () => {
    this.props.onCancel()
    this.props.closeModal()
  }

  render () {
    const {left, right} = this.state

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
      <React.Fragment>
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
        {
          this.state.isWarningModalOpen &&
          <AlertModal
            type='warning'
            alertOverlay
            heading={i18n.t('modal.global_step_changes.heading')}>
            <div className={styles.button_row}>
              <span className={styles.modal_section_header}>{i18n.t('modal.global_step_changes.all_steps_header')}</span>
              {i18n.t('modal.global_step_changes.all_steps_cleared_settings')}
              <span className={styles.modal_section_header}>{i18n.t('modal.global_step_changes.other_potential_changes_header')}</span>
              <div className={styles.effect_row}>
                {i18n.t('modal.global_step_changes.multi_to_single')}
                {i18n.t('modal.global_step_changes.selected_wells_cleared')}
              </div>
              <div className={styles.effect_row}>
                {i18n.t('modal.global_step_changes.single_to_multi')}
                {i18n.t('modal.global_step_changes.tip_use_may_increase')}
              </div>
              <div className={styles.effect_row}>
                {i18n.t('modal.global_step_changes.next_pipette_smaller')}
                {i18n.t('modal.global_step_changes.tip_use_may_increase')}
              </div>
              <div className={styles.effect_row}>
                {i18n.t('modal.global_step_changes.next_tip_size_smaller')}
                {i18n.t('modal.global_step_changes.tip_use_may_increase')}
              </div>
              <OutlineButton
                className={styles.ok_button}
                onClick={this.handleCancel}>
                {i18n.t('button.cancel')}
              </OutlineButton>
              <OutlineButton
                className={styles.ok_button}
                onClick={this.savePipettes}>
                {i18n.t('button.ok')}
              </OutlineButton>
            </div>
          </AlertModal>
        }
      </React.Fragment>
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

const mapDTP = (dispatch: ThunkDispatch<*>): DP => ({
  onSave: (fields: EditPipettesFields) => {
    // TODO: only launch if changes protocol
    if (window.confirm(i18n.t('alert.window.confirm_create_new'))) {
      dispatch(pipetteThunks.editPipettes(fields))
    }
  },
  onCancel: () => console.log('tried to Cancel'),
})

export default connect(mapSTP, mapDTP)(EditPipettesModal)
