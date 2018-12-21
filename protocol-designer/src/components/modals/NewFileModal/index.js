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
import type {PipetteOnDeck, FormPipette, FormPipettesByMount} from '../../../step-forms'

type State = {
  fields: NewProtocolFields,
  pipettesByMount: FormPipettesByMount,
}

type Props = {
  useProtocolFields?: ?boolean,
  hideModal: boolean,
  onCancel: () => mixed,
  initialPipetteValues?: $PropertyType<State, 'pipettesByMount'>,
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
    left: {pipetteName: '', tiprackModel: null},
    right: {pipetteName: '', tiprackModel: null},
  },
}

// TODO IMMEDIATELY: factor this out to its own file
type PipProps = {
  initialTabIndex?: number,
  values: {[Mount]: FormPipette},
  // this handleChange should expect all fields to have name={Mount.pipetteFieldName}
  handleChange: (SyntheticInputEvent<*>) => mixed,
}

const ChangePipetteFields = (props: PipProps) => {
  const {
    values,
    handleChange,
  } = props
  const initialTabIndex = props.initialTabIndex || 1
  return (
    <React.Fragment>
      <div className={styles.mount_fields_row}>
        <div className={styles.mount_column}>
          <FormGroup key="leftPipetteModel" label="Left Pipette" className={formStyles.stacked_row}>
            <DropdownField
              tabIndex={initialTabIndex + 1}
              options={pipetteOptionsWithNone}
              value={values.left.pipetteName}
              name='left.pipetteName'
              onChange={handleChange} />
          </FormGroup>
          <FormGroup
            disabled={isEmpty(values.left.pipetteName)}
            key={'leftTiprackModel'}
            label={`${startCase('left')} Tiprack*`}
            className={formStyles.stacked_row}>
            <DropdownField
              tabIndex={initialTabIndex + 2}
              disabled={isEmpty(values.left.pipetteName)}
              options={tiprackOptions}
              value={values.left.tiprackModel}
              name='left.tiprackModel'
              onChange={handleChange} />
          </FormGroup>
        </div>
        <div className={styles.mount_column}>
          <FormGroup key="rightPipetteModel" label="Right Pipette" className={formStyles.stacked_row}>
            <DropdownField
              tabIndex={initialTabIndex + 3}
              options={pipetteOptionsWithNone}
              value={values.right.pipetteName}
              name='right.pipetteName'
              onChange={handleChange} />
          </FormGroup>
          <FormGroup
            disabled={isEmpty(values.right.pipetteName)}
            key={'rightTiprackModel'}
            label={`${startCase('right')} Tiprack*`}
            className={formStyles.stacked_row}>
            <DropdownField
              tabIndex={initialTabIndex + 4}
              disabled={isEmpty(values.right.pipetteName)}
              options={tiprackOptions}
              value={values.right.tiprackModel}
              name='right.tiprackModel'
              onChange={handleChange} />
          </FormGroup>
        </div>
      </div>

      <div className={styles.diagrams}>
        <TiprackDiagram containerType={values.left.tiprackModel} />
        <PipetteDiagram
          leftPipette={values.left.pipetteName}
          rightPipette={values.right.pipetteName}
        />
        <TiprackDiagram containerType={values.right.tiprackModel} />
      </div>
    </React.Fragment>
  )
}

// TODO IMMEDIATELY rename this component
export default class NewFileModal extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      ...initialState,
      pipettesByMount: {
        ...initialState.pipettesByMount,
        ...(props.initialPipetteValues || {}),
      },
    }
  }

  componentDidUpdate (prevProps: Props) {
    // reset form state when modal is hidden
    if (!prevProps.hideModal && this.props.hideModal) this.setState(initialState)
  }

  handlePipetteFieldsChange = (e: SyntheticInputEvent<*>) => {
    const value: string = e.currentTarget.value
    if (!e.currentTarget.name) {
      console.error('handlePipetteFieldsChange expected nested field name, got no name with value:', e.currentTarget.value)
      return
    }
    const splitFieldName: [Mount, string] = e.currentTarget.name.split('.')
    const mount = splitFieldName[0]
    const fieldName = splitFieldName[1]
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
    const {useProtocolFields} = this.props

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
          <h2 className={styles.new_file_modal_title}>
            {/* TODO IMMEDIATELY: use i18n */}
            {useProtocolFields ? 'Create New Protocol' : 'Edit Pipettes'}
          </h2>

          {useProtocolFields && (
            <FormGroup className={formStyles.stacked_row} label='Name:'>
              <InputField
                autoFocus
                tabIndex={1}
                placeholder='Untitled'
                value={name}
                onChange={this.handleNameChange} />
            </FormGroup>
          )}

          <ChangePipetteFields
            initialTabIndex={1}
            values={this.state.pipettesByMount}
            handleChange={this.handlePipetteFieldsChange}
          />
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
