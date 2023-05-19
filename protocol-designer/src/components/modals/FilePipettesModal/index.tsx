import assert from 'assert'
import reduce from 'lodash/reduce'
import * as React from 'react'
import cx from 'classnames'
import { Formik, FormikProps } from 'formik'
import * as Yup from 'yup'
import {
  getIsCrashablePipetteSelected,
  PipetteOnDeck,
  FormPipette,
  FormPipettesByMount,
  FormModulesByType,
} from '../../../step-forms'
import {
  Modal,
  FormGroup,
  InputField,
  OutlineButton,
} from '@opentrons/components'
import {
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
  HEATERSHAKER_MODULE_TYPE,
  ModuleType,
  ModuleModel,
  getPipetteNameSpecs,
  PipetteName,
  MAGNETIC_BLOCK_V1,
  MAGNETIC_BLOCK_TYPE,
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
import { DeckSlot } from '../../../types'
import { NewProtocolFields } from '../../../load-file'

export type PipetteFieldsData = Omit<
  PipetteOnDeck,
  'id' | 'spec' | 'tiprackLabwareDef'
>

export interface ModuleCreationArgs {
  type: ModuleType
  model: ModuleModel
  slot: DeckSlot
}

export interface FormState {
  fields: NewProtocolFields
  pipettesByMount: FormPipettesByMount
  modulesByType: FormModulesByType
}

interface State {
  showEditPipetteConfirmation: boolean
}

export interface Props {
  showProtocolFields?: boolean | null
  showModulesFields?: boolean | null
  hideModal?: boolean
  onCancel: () => unknown
  initialPipetteValues?: FormState['pipettesByMount']
  initialModuleValues?: FormState['modulesByType']
  onSave: (args: {
    newProtocolFields: NewProtocolFields
    pipettes: PipetteFieldsData[]
    modules: ModuleCreationArgs[]
  }) => unknown
  moduleRestrictionsDisabled?: boolean | null
}
const initialFormState: FormState = {
  fields: { name: '' },
  pipettesByMount: {
    left: { pipetteName: '', tiprackDefURI: null },
    right: { pipetteName: '', tiprackDefURI: null },
  },
  modulesByType: {
    [MAGNETIC_BLOCK_TYPE]: {
      onDeck: false,
      model: MAGNETIC_BLOCK_V1,
      slot: '1',
    },
    [HEATERSHAKER_MODULE_TYPE]: {
      onDeck: false,
      model: HEATERSHAKER_MODULE_V1,
      slot: '1',
    },
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
      model: THERMOCYCLER_MODULE_V1, // Default to GEN1 for TC only
      slot: SPAN7_8_10_11_SLOT,
    },
  },
}

const pipetteValidationShape = Yup.object().shape({
  pipetteName: Yup.string().nullable(),
  tiprackDefURI: Yup.string()
    .nullable()
    .when('pipetteName', {
      is: (val: string | null): boolean => Boolean(val),
      then: Yup.string().required('Required'),
      otherwise: null,
    }),
})
// any typing this because TS says there are too many possibilities of what this could be
const moduleValidationShape: any = Yup.object().shape({
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
      // @ts-expect-error(sa, 2021-6-21): TS not extracting type of value properly
      Object.keys(value).some((val: string) => value[val].pipetteName)
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

  componentDidUpdate(prevProps: Props): void {
    if (!prevProps.hideModal && this.props.hideModal)
      this.setState({ showEditPipetteConfirmation: false })
  }

  getCrashableModuleSelected: (
    modules: FormModulesByType,
    moduleType: ModuleType
  ) => boolean = (modules, moduleType) => {
    const formModule = modules[moduleType]
    const crashableModuleOnDeck =
      formModule?.onDeck && formModule?.model
        ? isModuleWithCollisionIssue(formModule.model)
        : false

    return crashableModuleOnDeck
  }

  handleSubmit: (values: FormState) => void = values => {
    const { showProtocolFields } = this.props
    const { showEditPipetteConfirmation } = this.state

    if (!showProtocolFields && !showEditPipetteConfirmation) {
      return this.showEditPipetteConfirmationModal()
    }

    const newProtocolFields = values.fields
    const pipettes = reduce<FormPipettesByMount, PipetteFieldsData[]>(
      values.pipettesByMount,
      (acc, formPipette: FormPipette, mount): PipetteFieldsData[] => {
        assert(mount === 'left' || mount === 'right', `invalid mount: ${mount}`) // this is mostly for flow
        // @ts-expect-error(sa, 2021-6-21): TODO validate that pipette names coming from the modal are actually valid pipette names on PipetteName type
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
    // @ts-expect-error(sa, 2021-6-21): TS not smart enough to take real type from Object.keys
    const moduleTypes: ModuleType[] = Object.keys(values.modulesByType)
    const modules: ModuleCreationArgs[] = moduleTypes.reduce<
      ModuleCreationArgs[]
    >((acc, moduleType) => {
      const formModule = values.modulesByType[moduleType]
      return formModule?.onDeck
        ? [
            ...acc,
            {
              type: moduleType,
              model: formModule.model || ('' as ModuleModel), // TODO: we need to validate that module models are of type ModuleModel
              slot: formModule.slot,
            },
          ]
        : acc
    }, [])
    const heaterShakerIndex = modules.findIndex(
      hwModule => hwModule.type === HEATERSHAKER_MODULE_TYPE
    )
    const magModIndex = modules.findIndex(
      hwModule => hwModule.type === MAGNETIC_MODULE_TYPE
    )
    if (heaterShakerIndex > -1 && magModIndex > -1) {
      // if both are present, move the Mag mod to slot 9, since both can't be in slot 1
      modules[magModIndex].slot = '9'
    }
    this.props.onSave({ modules, newProtocolFields, pipettes })
  }

  showEditPipetteConfirmationModal: () => void = () => {
    this.setState({ showEditPipetteConfirmation: true })
  }

  handleCancel: () => void = () => {
    this.setState({ showEditPipetteConfirmation: false })
  }

  getInitialValues: () => FormState = () => {
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

  render(): React.ReactNode | null {
    if (this.props.hideModal) return null
    const { showProtocolFields, moduleRestrictionsDisabled } = this.props

    return (
      <React.Fragment>
        <Modal
          contentsClassName={cx(
            styles.new_file_modal_contents,
            modalStyles.scrollable_modal_wrapper,
            { [styles.edit_pipettes_modal]: !showProtocolFields }
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
                  const hasHeaterShakerSelected = Boolean(
                    values.modulesByType[HEATERSHAKER_MODULE_TYPE].onDeck
                  )

                  const showHeaterShakerPipetteCollisions =
                    hasHeaterShakerSelected &&
                    [
                      getPipetteNameSpecs(left.pipetteName as PipetteName),
                      getPipetteNameSpecs(right.pipetteName as PipetteName),
                    ].some(
                      pipetteSpecs =>
                        pipetteSpecs && pipetteSpecs.channels !== 1
                    )

                  const crashablePipetteSelected = getIsCrashablePipetteSelected(
                    values.pipettesByMount
                  )

                  const showTempPipetteCollisons =
                    crashablePipetteSelected &&
                    hasCrashableTemperatureModuleSelected
                  const showMagPipetteCollisons =
                    crashablePipetteSelected && hasCrashableMagnetModuleSelected

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
                          // @ts-expect-error(sa, 2021-7-2): we need to explicitly check that the module tiprackDefURI inside of pipettesByMount exists, because it could be undefined
                          errors={errors.pipettesByMount ?? null}
                          // @ts-expect-error(sa, 2021-7-2): we need to explicitly check that the module tiprackDefURI inside of pipettesByMount exists, because it could be undefined
                          touched={touched.pipettesByMount ?? null}
                          onSetFieldTouched={setFieldTouched}
                        />

                        {this.props.showModulesFields && (
                          <div className={styles.protocol_modules_group}>
                            <h2 className={styles.new_file_modal_title}>
                              {i18n.t(
                                'modal.new_protocol.title.PROTOCOL_MODULES'
                              )}
                            </h2>
                            <ModuleFields
                              // @ts-expect-error(sa, 2021-7-2): we need to explicitly check that the module model inside of modulesByType exists, because it could be undefined
                              errors={errors.modulesByType ?? null}
                              values={values.modulesByType}
                              onFieldChange={handleChange}
                              onSetFieldValue={setFieldValue}
                              onBlur={handleBlur}
                              // @ts-expect-error(sa, 2021-7-2): we need to explicitly check that the module model inside of modulesByType exists, because it could be undefined
                              touched={touched.modulesByType ?? null}
                              onSetFieldTouched={setFieldTouched}
                            />
                          </div>
                        )}
                        {!moduleRestrictionsDisabled && (
                          <CrashInfoBox
                            showDiagram
                            showMagPipetteCollisons={showMagPipetteCollisons}
                            showTempPipetteCollisons={showTempPipetteCollisons}
                            showHeaterShakerLabwareCollisions={
                              hasHeaterShakerSelected
                            }
                            showHeaterShakerModuleCollisions={
                              hasHeaterShakerSelected
                            }
                            showHeaterShakerPipetteCollisions={
                              showHeaterShakerPipetteCollisions
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
                            // @ts-expect-error(sa, 2021-6-21): Formik handleSubmit type not cooporating with OutlineButton onClick type
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
