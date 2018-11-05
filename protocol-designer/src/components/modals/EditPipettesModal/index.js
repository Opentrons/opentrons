// @flow
import * as React from 'react'
import cx from 'classnames'
import {connect} from 'react-redux'

import {
  AlertModal,
  DropdownField,
  FormGroup,
  type Mount,
} from '@opentrons/components'
import startCase from 'lodash/startCase'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'

import type {PipetteData} from '../../../step-generation'
import i18n from '../../../localization'
import type {BaseState, ThunkDispatch} from '../../../types'
import {pipetteOptions} from '../../../pipettes/pipetteData'
import type {PipetteFields} from '../../../load-file'
import {
  thunks as pipetteThunks,
  selectors as pipetteSelectors,
  type EditPipettesFields,
  type FormattedPipette,
  createPipette,
  type PipettesByMount,
} from '../../../pipettes'

import PipetteDiagram from '../NewFileModal/PipetteDiagram'
import TiprackDiagram from '../NewFileModal/TiprackDiagram'
import styles from './EditPipettesModal.css'
import modalStyles from '../modal.css'
import StepChangesWarningModal from './StepChangesWarningModal'

type State = EditPipettesFields & {isWarningModalOpen: boolean}

type OP = {closeModal: () => void}
type SP = {
  initialLeft: ?FormattedPipette,
  initialRight: ?FormattedPipette,
}

type DP = {
  _changePipettes: (PipettesByMount) => mixed,
}

type Props = {
  initialLeft: ?FormattedPipette,
  initialRight: ?FormattedPipette,
  updatePipettes: (EditPipettesFields) => mixed,
  closeModal: () => void,
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
  {name: '300 μL', value: 'opentrons-tiprack-300ul'},
  {name: '1000 μL', value: 'tiprack-1000ul'},
  {name: '1000 μL Chem', value: 'tiprack-1000ul-chem'},
  // {name: '300 μL', value: 'GEB-tiprack-300ul'} // NOTE this is not supported by Python API yet
]

const DEFAULT_SELECTION = {pipetteModel: '', tiprackModel: null}

const pipetteDataToFormState = (pipetteData) => ({
  pipetteModel: (pipetteData && pipetteData.model) ? pipetteData.model : '',
  tiprackModel: (pipetteData && pipetteData.tiprack && pipetteData.tiprack.model) ? pipetteData.tiprack.model : null,
})

class EditPipettesModal extends React.Component<Props, State> {
  constructor (props) {
    super(props)
    const {initialLeft, initialRight} = props
    this.state = {
      left: initialLeft ? pipetteDataToFormState(initialLeft) : DEFAULT_SELECTION,
      right: initialRight ? pipetteDataToFormState(initialRight) : DEFAULT_SELECTION,
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
    const {initialLeft, initialRight} = this.props
    const {left, right} = this.state
    const initialLeftFormData = pipetteDataToFormState(initialLeft)
    const initialRightFormData = pipetteDataToFormState(initialRight)
    const leftChanged = !isEqual(initialLeft, left)
    const rightChanged = !isEqual(initialRight, right)
    if ((leftChanged && !isEmpty(initialLeftFormData.pipetteModel)) || (rightChanged && !isEmpty(initialRightFormData.pipetteModel))) {
      this.setState({isWarningModalOpen: true})
    } else {
      this.savePipettes()
    }
  }

  savePipettes = () => {
    const {left, right} = this.state
    this.props.updatePipettes({left, right})
    this.props.closeModal()
  }

  handleCancel = () => {
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
          contentsClassName={styles.modal_contents}
          buttons={[
            {onClick: this.handleCancel, children: 'Cancel', tabIndex: 7},
            {onClick: this.handleSubmit, disabled: !canSubmit, children: 'Save', tabIndex: 6},
          ]}>
          <form onSubmit={() => { canSubmit && this.handleSubmit() }}>
            <h2>{i18n.t('modal.edit_pipettes.title')}</h2>
            <p className={styles.edit_pipettes_description}>{i18n.t('modal.edit_pipettes.body')}</p>

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
          <StepChangesWarningModal onCancel={this.handleCancel} onConfirm={this.savePipettes} />
        }
      </React.Fragment>
    )
  }
}

const mapSTP = (state: BaseState): SP => {
  const pipetteData = pipetteSelectors.pipettesForEditPipettes(state)
  return {
    initialLeft: pipetteData.find(i => i.mount === 'left'),
    initialRight: pipetteData.find(i => i.mount === 'right'),
  }
}

const mapDTP = (dispatch: ThunkDispatch<*>): DP => ({
  _changePipettes: (fields: PipettesByMount) => {
    dispatch(pipetteThunks.editPipettes(fields))
  },
})

const getNextPipetteForMount = (
  prevPipette: ?FormattedPipette,
  nextPipetteData: PipetteFields,
  mount: Mount,
): ?PipetteData => {
  const {id, model, maxVolume, channels, tiprack} = prevPipette || {}
  let nextPipette = {id, mount, model, maxVolume, channels, tiprackModel: tiprack && tiprack.model}

  const nextPipetteModel = nextPipetteData.pipetteModel
  const nextTiprackModel = isEmpty(nextPipetteData.tiprackModel) ? null : nextPipetteData.tiprackModel

  if (prevPipette) {
    const hasPipetteModelChanged = prevPipette.model !== nextPipetteModel
    if (hasPipetteModelChanged) {
      // old pipette -> new pipette model and tiprack
      nextPipette = nextPipetteModel ? createPipette(mount, nextPipetteModel, nextTiprackModel) : null
    } else if (nextPipetteModel && (prevPipette.tiprack.model !== nextTiprackModel)) {
      // old pipette -> same pipette model and new tiprack
      nextPipette = nextTiprackModel ? {...nextPipette, tiprackModel: nextTiprackModel} : nextPipette
    }
  } else if (nextPipetteModel) {
    // no old pipette -> new pipette model and new tiprack
    nextPipette = createPipette(mount, nextPipetteModel, nextTiprackModel)
  } else {
    // no old pipette -> no new pipette
    nextPipette = null
  }
  return nextPipette
}

const mergeProps = (stateProps: SP, dispatchProps: DP, ownProps: OP): Props => {
  const {initialLeft, initialRight} = stateProps
  const {closeModal} = ownProps
  const updatePipettes = (fields) => {
    dispatchProps._changePipettes({
      left: getNextPipetteForMount(initialLeft, fields.left, 'left'),
      right: getNextPipetteForMount(initialRight, fields.right, 'right'),
    })
  }
  return {
    initialLeft,
    initialRight,
    updatePipettes,
    closeModal,
  }
}

export default connect(mapSTP, mapDTP, mergeProps)(EditPipettesModal)
