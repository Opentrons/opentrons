// @flow
import assert from 'assert'
import reduce from 'lodash/reduce'
import omit from 'lodash/omit'
import * as React from 'react'
import cx from 'classnames'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { getIsCrashablePipetteSelected } from '../../../step-forms'
import {
  Modal,
  FormGroup,
  InputField,
  OutlineButton,
} from '@opentrons/components'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { i18n } from '../../../localization'
import { SPAN7_8_10_11_SLOT } from '../../../constants'
import { StepChangesConfirmModal } from '../EditPipettesModal/StepChangesConfirmModal'
import { ModuleFields } from './ModuleFields'
import { PipetteFields } from './PipetteFields'
import { CrashInfoBox, isModuleWithCollisionIssue } from '../../modules'
import styles from './FilePipettesModal.css'
import formStyles from '../../forms/forms.css'
import modalStyles from '../modal.css'
import type { ModuleRealType } from '@opentrons/shared-data'
import type { DeckSlot } from '../../../types'
import type { NewProtocolFields } from '../../../load-file'
import type {
  PipetteOnDeck,
  FormPipette,
  FormPipettesByMount,
  FormModulesByType,
} from '../../../step-forms'
import type { FormikProps } from 'formik/@flow-typed'

type PipetteFieldsData = $Diff<
  PipetteOnDeck,
  {| id: mixed, spec: mixed, tiprackLabwareDef: mixed |}
>

type ModuleCreationArgs = {|
  type: ModuleRealType,
  model: string,
  slot: DeckSlot,
|}

type FormState = {|
  fields: NewProtocolFields,
  pipettesByMount: FormPipettesByMount,
  modulesByType: FormModulesByType,
|}

type State = {|
  showEditPipetteConfirmation: boolean,
|}

export type Props = {|
  showProtocolFields?: ?boolean,
  showModulesFields?: ?boolean,
  hideModal?: boolean,
  onCancel: () => mixed,
  initialPipetteValues?: $PropertyType<FormState, 'pipettesByMount'>,
  initialModuleValues?: $PropertyType<FormState, 'modulesByType'>,
  onSave: ({|
    newProtocolFields: NewProtocolFields,
    pipettes: Array<PipetteFieldsData>,
    modules: Array<ModuleCreationArgs>,
  |}) => mixed,
  modulesEnabled: ?boolean,
  thermocyclerEnabled: ?boolean,
  moduleRestrictionsDisabled: ?boolean,
|}

const initialFormState: FormState = {
  fields: { name: '' },
  pipettesByMount: {
    left: { pipetteName: '', tiprackDefURI: null },
    right: { pipetteName: '', tiprackDefURI: null },
  },
  modulesByType: {
    [MAGNETIC_MODULE_TYPE]: {
      onDeck: false,
      model: null,
      slot: '1',
    },
    [TEMPERATURE_MODULE_TYPE]: {
      onDeck: false,
      model: null,
      slot: '3',
    },
    [THERMOCYCLER_MODULE_TYPE]: {
      onDeck: false,
      model: null,
      slot: SPAN7_8_10_11_SLOT,
    },
  },
}

const pipetteValidationShape = Yup.object().shape({
  pipetteName: Yup.string().nullable(),
  tiprackDefURI: Yup.string()
    .nullable()
    .when('pipetteName', {
      is: val => Boolean(val),
      then: Yup.string().required('Required'),
      otherwise: null,
    }),
})
const moduleValidationShape = Yup.object().shape({
  onDeck: Yup.boolean().default(false),
  model: Yup.string()
    .nullable()
    .when('onDeck', {
      is: true,
      then: Yup.string().required('Required'),
      otherwise: null,
    }),
  slot: Yup.string(),
})

const validationSchema = Yup.object().shape({
  fields: Yup.object().shape({
    name: Yup.string(),
  }),
  pipettesByMount: Yup.object()
    .shape({
      left: pipetteValidationShape,
      right: pipetteValidationShape,
    })
    .test('pipette-is-required', 'a pipette is required', value =>
      Object.keys(value).some(val => value[val].pipetteName)
    ),
  modulesByType: Yup.object().shape({
    [MAGNETIC_MODULE_TYPE]: moduleValidationShape,
    [TEMPERATURE_MODULE_TYPE]: moduleValidationShape,
    [THERMOCYCLER_MODULE_TYPE]: moduleValidationShape,
  }),
})

// TODO: Ian 2019-03-15 use i18n for labels
export class FilePipettesModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      showEditPipetteConfirmation: false,
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.hideModal && this.props.hideModal)
      this.setState({ showEditPipetteConfirmation: false })
  }

  getCrashableModuleSelected = (
    modules: FormModulesByType,
    moduleType: ModuleRealType
  ) => {
    const formModule = modules[moduleType]
    const crashableModuleOnDeck =
      formModule.onDeck && formModule.model
        ? isModuleWithCollisionIssue(formModule.model)
        : false

    return crashableModuleOnDeck
  }

  handleSubmit = (values: FormState) => {
    const { showProtocolFields } = this.props
    const { showEditPipetteConfirmation } = this.state

    if (!showProtocolFields && !showEditPipetteConfirmation) {
      return this.showEditPipetteConfirmationModal()
    }

    const newProtocolFields = values.fields
    const pipettes = reduce(
      values.pipettesByMount,
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
    // with enum-typed key like `{[ModuleRealType]: ___}`
    const moduleTypes: Array<ModuleRealType> = Object.keys(values.modulesByType)
    const modules: Array<ModuleCreationArgs> = moduleTypes.reduce(
      (acc, moduleType) => {
        const formModule = values.modulesByType[moduleType]
        return formModule?.onDeck
          ? [
              ...acc,
              {
                type: moduleType,
                model: formModule.model || '',
                slot: formModule.slot,
              },
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

  getInitialValues = () => {
    return {
      ...initialFormState,
      pipettesByMount: {
        ...initialFormState.pipettesByMount,
        ...this.props.initialPipetteValues,
      },
      modulesByType: {
        ...initialFormState.modulesByType,
        ...this.props.initialModuleValues,
      },
    }
  }

  render() {
    if (this.props.hideModal) return null
    const { showProtocolFields, moduleRestrictionsDisabled } = this.props

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
              <Formik
                enableReinitialize
                initialValues={this.getInitialValues()}
                onSubmit={this.handleSubmit}
                validationSchema={validationSchema}
                validateOnChange={false}
              >
                {({
                  handleChange,
                  handleSubmit,
                  errors,
                  setFieldValue,
                  touched,
                  values,
                  handleBlur,
                  setFieldTouched,
                }: FormikProps<FormState>) => {
                  const { left, right } = values.pipettesByMount

                  const pipetteSelectionIsValid =
                    // at least one must not be none (empty string)
                    left.pipetteName || right.pipetteName

                  const hasCrashableMagnetModuleSelected = this.getCrashableModuleSelected(
                    values.modulesByType,
                    MAGNETIC_MODULE_TYPE
                  )
                  const hasCrashableTemperatureModuleSelected = this.getCrashableModuleSelected(
                    values.modulesByType,
                    TEMPERATURE_MODULE_TYPE
                  )
                  const showCrashInfoBox =
                    getIsCrashablePipetteSelected(values.pipettesByMount) &&
                    (hasCrashableMagnetModuleSelected ||
                      hasCrashableTemperatureModuleSelected)

                  const visibleModules = this.props.thermocyclerEnabled
                    ? values.modulesByType
                    : omit(values.modulesByType, THERMOCYCLER_MODULE_TYPE)

                  return (
                    <>
                      <form onSubmit={handleSubmit}>
                        {showProtocolFields && (
                          <div className={styles.protocol_file_group}>
                            <h2 className={styles.new_file_modal_title}>
                              {i18n.t('modal.new_protocol.title.PROTOCOL_FILE')}
                            </h2>
                            <FormGroup
                              className={formStyles.stacked_row}
                              label="Name"
                            >
                              <InputField
                                autoFocus
                                tabIndex={1}
                                placeholder={i18n.t(
                                  'form.generic.default_protocol_name'
                                )}
                                name="fields.name"
                                value={values.fields.name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </FormGroup>
                          </div>
                        )}

                        <h2 className={styles.new_file_modal_title}>
                          {showProtocolFields
                            ? i18n.t(
                                'modal.new_protocol.title.PROTOCOL_PIPETTES'
                              )
                            : i18n.t('modal.edit_pipettes.title')}
                        </h2>

                        <PipetteFields
                          initialTabIndex={1}
                          values={values.pipettesByMount}
                          onFieldChange={handleChange}
                          onSetFieldValue={setFieldValue}
                          onBlur={handleBlur}
                          errors={errors.pipettesByMount ?? null}
                          touched={touched.pipettesByMount ?? null}
                          onSetFieldTouched={setFieldTouched}
                        />

                        {this.props.modulesEnabled &&
                          this.props.showModulesFields && (
                            <div className={styles.protocol_modules_group}>
                              <h2 className={styles.new_file_modal_title}>
                                {i18n.t(
                                  'modal.new_protocol.title.PROTOCOL_MODULES'
                                )}
                              </h2>
                              <ModuleFields
                                errors={errors.modulesByType ?? null}
                                values={visibleModules}
                                thermocyclerEnabled={
                                  this.props.thermocyclerEnabled
                                }
                                onFieldChange={handleChange}
                                onSetFieldValue={setFieldValue}
                                onBlur={handleBlur}
                                touched={touched.modulesByType ?? null}
                                onSetFieldTouched={setFieldTouched}
                              />
                            </div>
                          )}
                        {showCrashInfoBox && !moduleRestrictionsDisabled && (
                          <CrashInfoBox
                            showDiagram
                            magnetOnDeck={hasCrashableMagnetModuleSelected}
                            temperatureOnDeck={
                              hasCrashableTemperatureModuleSelected
                            }
                          />
                        )}
                        <div className={modalStyles.button_row}>
                          <OutlineButton
                            onClick={this.props.onCancel}
                            tabIndex={7}
                            className={styles.button}
                          >
                            {i18n.t('button.cancel')}
                          </OutlineButton>
                          <OutlineButton
                            disabled={!pipetteSelectionIsValid}
                            onClick={handleSubmit}
                            tabIndex={6}
                            className={styles.button}
                          >
                            {i18n.t('button.save')}
                          </OutlineButton>
                        </div>
                      </form>

                      {this.state.showEditPipetteConfirmation && (
                        <StepChangesConfirmModal
                          onCancel={this.handleCancel}
                          onConfirm={handleSubmit}
                        />
                      )}
                    </>
                  )
                }}
              </Formik>
            </div>
          </div>
        </Modal>
      </React.Fragment>
    )
  }
}
