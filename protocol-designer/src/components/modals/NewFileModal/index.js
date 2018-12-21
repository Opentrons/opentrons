// @flow
import * as React from 'react'
import cx from 'classnames'
import assert from 'assert'
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
import reduce from 'lodash/reduce'
import i18n from '../../../localization'
import {pipetteOptions} from '../../../pipettes/pipetteData'
import PipetteDiagram from './PipetteDiagram'
import TiprackDiagram from './TiprackDiagram'
import styles from './NewFileModal.css'
import formStyles from '../../forms.css'
import modalStyles from '../modal.css'
import type {NewProtocolFields} from '../../../load-file'
import type {PipetteOnDeck} from '../../../step-forms'

type FormPipette = {pipetteName: ?string, tiprackModel: ?string} // TODO IMMEDIATELY

type State = {
  fields: NewProtocolFields,
  pipettesByMount: {[Mount]: FormPipette},
}

type Props = {
  hideModal: boolean,
  onCancel: () => mixed,
  onSave: ({
    newProtocolFields: NewProtocolFields,
    pipettes: Array<PipetteOnDeck>,
  }) => mixed,
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
  fields: {name: ''},
  pipettesByMount: {
    left: {pipetteName: '', tiprackModel: null}, // TODO IMMEDIATELY why '' vs null?
    right: {pipetteName: '', tiprackModel: null},
  },
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

  makeHandleMountChange = (mount: Mount, fieldName: $Keys<FormPipette>) => (e: SyntheticInputEvent<*>) => {
    const value: string = e.target.value
    let nextMountState = {[fieldName]: value}
    if (fieldName === 'pipetteName') nextMountState = {...nextMountState, tiprackModel: null}
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
    this.setState({fields: {...this.state.fields, name: e.target.value}})

  handleSubmit = () => {
    const newProtocolFields = this.state.fields
    const pipettes = reduce(this.state.pipettesByMount, (acc, formPipette: FormPipette, mount): Array<PipetteOnDeck> => {
      assert(mount === 'left' || mount === 'right', `invalid mount: ${mount}`) // this is mostly for flow
      return (formPipette && formPipette.pipetteName && formPipette.tiprackModel && (mount === 'left' || mount === 'right'))
        ? [...acc, {mount, name: formPipette.pipetteName, tiprackModel: formPipette.tiprackModel}]
        : acc
    }, [])
    this.props.onSave({pipettes, newProtocolFields})
  }

  render () {
    if (this.props.hideModal) return null

    const {name} = this.state.fields
    const {left, right} = this.state.pipettesByMount

    const pipetteSelectionIsValid = (
      // at least one must not be none (empty string)
      (left.pipetteName || right.pipetteName)
    )

    // if pipette selected, corresponding tiprack type also selected
    const tiprackSelectionIsValid = (
      (left.pipetteName ? Boolean(left.tiprackModel) : true) &&
      (right.pipetteName ? Boolean(right.tiprackModel) : true)
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
                  value={this.state.pipettesByMount.left.pipetteName}
                  onChange={this.makeHandleMountChange('left', 'pipetteName')} />
              </FormGroup>
              <FormGroup
                disabled={isEmpty(this.state.pipettesByMount.left.pipetteName)}
                key={'leftTiprackModel'}
                label={`${startCase('left')} Tiprack*`}
                className={formStyles.stacked_row}>
                <DropdownField
                  tabIndex={3}
                  disabled={isEmpty(this.state.pipettesByMount.left.pipetteName)}
                  options={tiprackOptions}
                  value={this.state.pipettesByMount.left.tiprackModel}
                  onChange={this.makeHandleMountChange('left', 'tiprackModel')} />
              </FormGroup>
            </div>
            <div className={styles.mount_column}>
              <FormGroup key="rightPipetteModel" label="Right Pipette" className={formStyles.stacked_row}>
                <DropdownField
                  tabIndex={4}
                  options={pipetteOptionsWithNone}
                  value={this.state.pipettesByMount.right.pipetteName}
                  onChange={this.makeHandleMountChange('right', 'pipetteName')} />
              </FormGroup>
              <FormGroup
                disabled={isEmpty(this.state.pipettesByMount.right.pipetteName)}
                key={'rightTiprackModel'}
                label={`${startCase('right')} Tiprack*`}
                className={formStyles.stacked_row}>
                <DropdownField
                  tabIndex={5}
                  disabled={isEmpty(this.state.pipettesByMount.right.pipetteName)}
                  options={tiprackOptions}
                  value={this.state.pipettesByMount.right.tiprackModel}
                  onChange={this.makeHandleMountChange('right', 'tiprackModel')} />
              </FormGroup>
            </div>
          </div>

          <div className={styles.diagrams}>
            <TiprackDiagram containerType={this.state.pipettesByMount.left.tiprackModel} />
            <PipetteDiagram
              leftPipette={this.state.pipettesByMount.left.pipetteName}
              rightPipette={this.state.pipettesByMount.right.pipetteName}
            />
            <TiprackDiagram containerType={this.state.pipettesByMount.right.tiprackModel} />
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
