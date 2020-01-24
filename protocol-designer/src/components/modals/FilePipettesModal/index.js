// @flow
import assert from 'assert'
import reduce from 'lodash/reduce'
import omit from 'lodash/omit'
import * as React from 'react'
import cx from 'classnames'
import { getCrashablePipetteSelected } from '../../../step-forms'
import {
  Modal,
  FormGroup,
  InputField,
  OutlineButton,
  type Mount,
} from '@opentrons/components'
import i18n from '../../../localization'
import { SPAN7_8_10_11_SLOT, THERMOCYCLER } from '../../../constants'
import StepChangesConfirmModal from '../EditPipettesModal/StepChangesConfirmModal'
import ModuleFields from './ModuleFields'
import PipetteFields from './PipetteFields'
import { CrashInfoBox } from '../../modules'
import styles from './FilePipettesModal.css'
import formStyles from '../../forms/forms.css'
import modalStyles from '../modal.css'
import type { ModuleType } from '@opentrons/shared-data'
import type { DeckSlot } from '../../../types'
import type { NewProtocolFields } from '../../../load-file'
import type {
  PipetteOnDeck,
  FormPipette,
  FormPipettesByMount,
  FormModule,
  FormModulesByType,
} from '../../../step-forms'

type PipetteFieldsData = $Diff<
  PipetteOnDeck,
  {| id: mixed, spec: mixed, tiprackLabwareDef: mixed |}
>

type ModuleCreationArgs = {| type: ModuleType, model: string, slot: DeckSlot |}

type State = {|
  fields: NewProtocolFields,
  pipettesByMount: FormPipettesByMount,
  showEditPipetteConfirmation: boolean,
  modulesByType: FormModulesByType,
|}

type Props = {|
  showProtocolFields?: ?boolean,
  showModulesFields?: ?boolean,
  hideModal?: boolean,
  onCancel: () => mixed,
  initialPipetteValues?: $PropertyType<State, 'pipettesByMount'>,
  initialModuleValues?: $PropertyType<State, 'modulesByType'>,
  onSave: ({|
    newProtocolFields: NewProtocolFields,
    pipettes: Array<PipetteFieldsData>,
    modules: Array<ModuleCreationArgs>,
  |}) => mixed,
  modulesEnabled: ?boolean,
  thermocyclerEnabled: ?boolean,
|}

const initialState: State = {
  fields: { name: '' },
  showEditPipetteConfirmation: false,
  pipettesByMount: {
    left: { pipetteName: '', tiprackDefURI: null },
    right: { pipetteName: '', tiprackDefURI: null },
  },
  modulesByType: {
    magdeck: { onDeck: false, model: 'GEN1', slot: '1' },
    tempdeck: { onDeck: false, model: 'GEN1', slot: '3' },
    thermocycler: { onDeck: false, model: 'GEN1', slot: SPAN7_8_10_11_SLOT },
  },
}

// TODO: Ian 2019-03-15 use i18n for labels
export class FilePipettesModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      ...initialState,
      pipettesByMount: {
        ...initialState.pipettesByMount,
        ...props.initialPipetteValues,
      },
      modulesByType: {
        ...initialState.modulesByType,
        ...props.initialModuleValues,
      },
    }
  }

  componentDidUpdate(prevProps: Props) {
    // reset form state when modal is hidden
    if (!prevProps.hideModal && this.props.hideModal)
      this.setState(initialState)
  }

  getCrashableModuleSelected = (modules: FormModulesByType) => {
    return modules.magdeck.onDeck || modules.tempdeck.onDeck
  }

  handlePipetteFieldsChange = (
    mount: Mount,
    fieldName: $Keys<FormPipette>,
    value: string | null
  ) => {
    let nextMountState: $Shape<FormPipette> = { [fieldName]: value }
    if (fieldName === 'pipetteName') {
      nextMountState = { ...nextMountState, tiprackDefURI: null }
    }

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

  handleModuleOnDeckChange = (type: ModuleType, value: boolean) => {
    let nextMountState: $Shape<FormModule> = { onDeck: value }
    this.setState({
      modulesByType: {
        ...this.state.modulesByType,
        [type]: {
          ...this.state.modulesByType[type],
          ...nextMountState,
        },
      },
    })
  }

  handleNameChange = (e: SyntheticInputEvent<*>) =>
    this.setState({ fields: { ...this.state.fields, name: e.target.value } })

  handleSubmit = () => {
    const newProtocolFields = this.state.fields
    const pipettes = reduce(
      this.state.pipettesByMount,
      (acc, formPipette: FormPipette, mount): Array<PipetteFieldsData> => {
        assert(mount === 'left' || mount === 'right', `invalid mount: ${mount}`) // this is mostly for flow
        return formPipette &&
          formPipette.pipetteName &&
          formPipette.tiprackDefURI &&
          (mount === 'left' || mount === 'right')
          ? [
              ...acc,
              {
                mount,
                name: formPipette.pipetteName,
                tiprackDefURI: formPipette.tiprackDefURI,
              },
            ]
          : acc
      },
      []
    )

    // NOTE: this is extra-explicit for flow. Reduce fns won't cooperate
    // with enum-typed key like `{[ModuleType]: ___}`
    const moduleTypes: Array<ModuleType> = Object.keys(this.state.modulesByType)
    const modules: Array<ModuleCreationArgs> = moduleTypes.reduce(
      (acc, moduleType) => {
        const module = this.state.modulesByType[moduleType]
        return module?.onDeck
          ? [
              ...acc,
              { type: moduleType, model: module.model, slot: module.slot },
            ]
          : acc
      },
      []
    )
    this.props.onSave({ modules, newProtocolFields, pipettes })
  }

  showEditPipetteConfirmationModal = () => {
    this.setState({ showEditPipetteConfirmation: true })
  }

  handleCancel = () => {
    this.setState({ showEditPipetteConfirmation: false })
  }

  render() {
    if (this.props.hideModal) return null
    const { showProtocolFields } = this.props

    const { name } = this.state.fields
    const { left, right } = this.state.pipettesByMount

    const pipetteSelectionIsValid =
      // at least one must not be none (empty string)
      left.pipetteName || right.pipetteName

    // if pipette selected, corresponding tiprack type also selected
    const tiprackSelectionIsValid =
      (left.pipetteName ? Boolean(left.tiprackDefURI) : true) &&
      (right.pipetteName ? Boolean(right.tiprackDefURI) : true)

    const canSubmit = pipetteSelectionIsValid && tiprackSelectionIsValid

    const showCrashInfoBox =
      getCrashablePipetteSelected(this.state.pipettesByMount) &&
      this.getCrashableModuleSelected(this.state.modulesByType)

    const visibleModules = this.props.thermocyclerEnabled
      ? this.state.modulesByType
      : omit(this.state.modulesByType, THERMOCYCLER)

    return (
      <React.Fragment>
        <Modal
          contentsClassName={cx(
            styles.new_file_modal_contents,
            modalStyles.scrollable_modal_wrapper
          )}
          className={cx(modalStyles.modal, styles.new_file_modal)}
        >
          <div className={modalStyles.scrollable_modal_wrapper}>
            <div className={modalStyles.scrollable_modal_scroll}>
              <form
                onSubmit={() => {
                  canSubmit && this.handleSubmit()
                }}
              >
                {showProtocolFields && (
                  <div className={styles.protocol_file_group}>
                    <h2 className={styles.new_file_modal_title}>
                      {i18n.t('modal.new_protocol.title.PROTOCOL_FILE')}
                    </h2>
                    <FormGroup className={formStyles.stacked_row} label="Name">
                      <InputField
                        autoFocus
                        tabIndex={1}
                        placeholder={i18n.t(
                          'form.generic.default_protocol_name'
                        )}
                        value={name}
                        onChange={this.handleNameChange}
                      />
                    </FormGroup>
                  </div>
                )}

                <h2 className={styles.new_file_modal_title}>
                  {showProtocolFields
                    ? i18n.t('modal.new_protocol.title.PROTOCOL_PIPETTES')
                    : i18n.t('modal.edit_pipettes.title')}
                </h2>

                <PipetteFields
                  initialTabIndex={1}
                  values={this.state.pipettesByMount}
                  onFieldChange={this.handlePipetteFieldsChange}
                />

                {this.props.modulesEnabled && this.props.showModulesFields && (
                  <div className={styles.protocol_modules_group}>
                    <h2 className={styles.new_file_modal_title}>
                      {i18n.t('modal.new_protocol.title.PROTOCOL_MODULES')}
                    </h2>
                    <ModuleFields
                      values={visibleModules}
                      thermocyclerEnabled={this.props.thermocyclerEnabled}
                      onFieldChange={this.handleModuleOnDeckChange}
                    />
                  </div>
                )}
              </form>

              {showCrashInfoBox && (
                <CrashInfoBox
                  showDiagram
                  magnetOnDeck={this.state.modulesByType.magdeck.onDeck}
                  temperatureOnDeck={this.state.modulesByType.tempdeck.onDeck}
                />
              )}

              <div className={styles.button_row}>
                <OutlineButton
                  onClick={this.props.onCancel}
                  tabIndex={7}
                  className={styles.button}
                >
                  {i18n.t('button.cancel')}
                </OutlineButton>
                <OutlineButton
                  onClick={
                    showProtocolFields
                      ? this.handleSubmit
                      : this.showEditPipetteConfirmationModal
                  }
                  disabled={!canSubmit}
                  tabIndex={6}
                  className={styles.button}
                >
                  {i18n.t('button.save')}
                </OutlineButton>
              </div>
            </div>
          </div>
        </Modal>
        {this.state.showEditPipetteConfirmation && (
          <StepChangesConfirmModal
            onCancel={this.handleCancel}
            onConfirm={this.handleSubmit}
          />
        )}
      </React.Fragment>
    )
  }
}
