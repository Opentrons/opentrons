import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import reduce from 'lodash/reduce'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import uniq from 'lodash/uniq'
import { Formik, FormikProps } from 'formik'
import * as Yup from 'yup'
import { ALIGN_STRETCH, DIRECTION_COLUMN, DropdownField, Flex, FormGroup, InputField, ModalShell, OutlineButton, SPACING, WizardHeader } from '@opentrons/components'
import { INITIAL_DECK_SETUP_STEP_ID } from '../../../constants'
import { uuid } from '../../../utils'
import { i18n } from '../../../localization'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import { actions as navigationActions } from '../../../navigation'
import { getNewProtocolModal } from '../../../navigation/selectors'
import {
  actions as fileActions,
  selectors as loadFileSelectors,
  NewProtocolFields,
} from '../../../load-file'
import * as labwareDefSelectors from '../../../labware-defs/selectors'
import * as labwareDefActions from '../../../labware-defs/actions'
import * as labwareIngredActions from '../../../labware-ingred/actions'
import { actions as steplistActions } from '../../../steplist'

import styles from '../FilePipettesModal/FilePipettesModal.css'
import formStyles from '../../forms/forms.css'
import modalStyles from '../modal.css'

import {
  ModuleType,
  ModuleModel,
  PipetteName,
  OT2_ROBOT_TYPE,
  MAGNETIC_BLOCK_TYPE,
  TEMPERATURE_MODULE_TYPE,
  MAGNETIC_BLOCK_V1,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_TYPE,
  SPAN7_8_10_11_SLOT,
  FLEX_ROBOT_TYPE,
  getPipetteNameSpecs
} from '@opentrons/shared-data'
import { CrashInfoBox, isModuleWithCollisionIssue } from '../../modules'
import { PipetteFields } from '../FilePipettesModal/PipetteFields'
import { ModuleFields } from '../FilePipettesModal/ModuleFields'

import {
  actions as stepFormActions,
  FormPipettesByMount,
  FormModulesByType,
  FormPipette,
  getIsCrashablePipetteSelected,
  PipetteOnDeck,
} from '../../../step-forms'

import type { NormalizedPipette } from '@opentrons/step-generation'

interface CreateFileFields {
  newProtocolFields: NewProtocolFields
  pipettes: PipetteFieldsData[]
  modules: ModuleCreationArgs[]
}

export function CreateFileWizard(): JSX.Element | null {
  const showWizard = useSelector(getNewProtocolModal)
  const moduleRestrictionsDisabled = useSelector(featureFlagSelectors.getDisableModuleRestrictions)
  const hasUnsavedChanges = useSelector(loadFileSelectors.getHasUnsavedChanges)
  const customLabware = useSelector(labwareDefSelectors.getCustomLabwareDefsByURI)

  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)

  const dispatch = useDispatch()

  const handleCancel = (): void => { dispatch(navigationActions.toggleNewProtocolModal(false)) }
  const handleSubmit = (fields: CreateFileFields): void => {
    if (!hasUnsavedChanges || window.confirm(i18n.t('alert.window.confirm_create_new'))) {

      const { modules, newProtocolFields, pipettes } = fields
      dispatch(fileActions.createNewProtocol(newProtocolFields))
      const pipettesById: Record<string, PipetteOnDeck> = pipettes.reduce(
        (acc, pipette) => ({ ...acc, [uuid()]: pipette }),
        {}
      )
      // create custom labware
      mapValues(customLabware, labwareDef =>
        dispatch(
          labwareDefActions.createCustomLabwareDefAction({
            def: labwareDef,
          })
        )
      )
      // create new pipette entities
      dispatch(
        stepFormActions.createPipettes(
          mapValues(
            pipettesById,
            (p: PipetteOnDeck, id: string): NormalizedPipette => ({
              // @ts-expect-error(sa, 2021-6-22): id will always get overwritten
              id,
              ...omit(p, 'mount'),
            })
          )
        )
      )
      // update pipette locations in initial deck setup step
      dispatch(
        steplistActions.changeSavedStepForm({
          stepId: INITIAL_DECK_SETUP_STEP_ID,
          update: {
            pipetteLocationUpdate: mapValues(
              pipettesById,
              (p: typeof pipettesById[keyof typeof pipettesById]) => p.mount
            ),
          },
        })
      )
      // create modules
      modules.forEach(moduleArgs =>
        dispatch(stepFormActions.createModule(moduleArgs))
      )
      // auto-generate tipracks for pipettes
      const newTiprackModels: string[] = uniq(
        pipettes.map(pipette => pipette.tiprackDefURI)
      )
      newTiprackModels.forEach(tiprackDefURI => {
        dispatch(
          labwareIngredActions.createContainer({
            labwareDefURI: tiprackDefURI,
          })
        )
      })
    }
  }
  const wizardHeader = (
    <WizardHeader
      title={"Create New Protocol"}
      currentStep={currentStepIndex}
      totalSteps={3}
      onExit={handleCancel}
    />
  )
  return showWizard ? (
    <ModalShell width="48rem" header={wizardHeader}>
      <Flex padding={SPACING.spacing16}>
        <CreateFileForm
          onSave={handleSubmit}
          onCancel={handleCancel}
          moduleRestrictionsDisabled={moduleRestrictionsDisabled}
        />
      </Flex>
    </ModalShell>
  ) : null
}

type PipetteFieldsData = Omit<
  PipetteOnDeck,
  'id' | 'spec' | 'tiprackLabwareDef'
>

interface ModuleCreationArgs {
  type: ModuleType
  model: ModuleModel
  slot: string
}

interface FormState {
  fields: NewProtocolFields
  pipettesByMount: FormPipettesByMount
  modulesByType: FormModulesByType
}

interface CreateFileFormProps {
  onCancel: () => unknown
  onSave: (args: {
    newProtocolFields: NewProtocolFields
    pipettes: PipetteFieldsData[]
    modules: ModuleCreationArgs[]
  }) => unknown
  moduleRestrictionsDisabled?: boolean | null
}

const initialFormState: FormState = {
  fields: { name: '', robotType: OT2_ROBOT_TYPE },
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

const ROBOT_TYPE_OPTIONS = [{ value: OT2_ROBOT_TYPE, name: 'OT2' }, { value: FLEX_ROBOT_TYPE, name: 'Opentrons Flex' }]

interface CreateFileFormProps {
  onCancel: () => unknown
  onSave: (args: {
    newProtocolFields: NewProtocolFields
    pipettes: PipetteFieldsData[]
    modules: ModuleCreationArgs[]
  }) => unknown
  moduleRestrictionsDisabled?: boolean | null
}

function CreateFileForm(props: CreateFileFormProps): JSX.Element {
  const { onSave, onCancel, moduleRestrictionsDisabled } = props

  const handleSubmit = (values: FormState): void => {
    const pipettes = reduce<FormPipettesByMount, PipetteFieldsData[]>(
      values.pipettesByMount,
      (acc, formPipette: FormPipette, mount): PipetteFieldsData[] => {
        return formPipette?.pipetteName != null &&
          formPipette.tiprackDefURI != null &&
          (mount === 'left' || mount === 'right')
          ? [
            ...acc,
            {
              mount,
              name: formPipette.pipetteName as PipetteName,
              tiprackDefURI: formPipette.tiprackDefURI,
            },
          ]
          : acc
      },
      []
    )

    const modules: ModuleCreationArgs[] = Object.entries(values.modulesByType).reduce<
      ModuleCreationArgs[]
    >((acc, [moduleType, formModule]) => {
      return formModule?.onDeck
        ? [
          ...acc,
          {
            type: moduleType as ModuleType,
            model: formModule.model || ('' as ModuleModel),
            slot: formModule.slot,
          },
        ]
        : acc
    }, [])
    const heaterShakerIndex = modules.findIndex(mod => mod.type === HEATERSHAKER_MODULE_TYPE)
    const magModIndex = modules.findIndex(mod => mod.type === MAGNETIC_MODULE_TYPE)
    if (heaterShakerIndex > -1 && magModIndex > -1) {
      // if both are present, move the Mag mod to slot 9, since both can't be in slot 1
      modules[magModIndex].slot = '9'
    }
    onSave({ modules, newProtocolFields: values.fields, pipettes })
  }

  const getCrashableModuleSelected = (
    modules: FormModulesByType,
    moduleType: ModuleType
  ): boolean => {
    const formModule = modules[moduleType]
    const crashableModuleOnDeck =
      formModule?.onDeck && formModule?.model
        ? isModuleWithCollisionIssue(formModule.model)
        : false

    return crashableModuleOnDeck
  }


  return (

    <Formik
      enableReinitialize
      initialValues={initialFormState}
      onSubmit={handleSubmit}
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

        const hasCrashableMagnetModuleSelected = getCrashableModuleSelected(
          values.modulesByType,
          MAGNETIC_MODULE_TYPE
        )
        const hasCrashableTemperatureModuleSelected = getCrashableModuleSelected(
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
          <form onSubmit={handleSubmit}>
            <div className={styles.protocol_file_group}>
              <Flex gridGap={SPACING.spacing16}>
                <h2 className={styles.new_file_modal_title}>
                  {i18n.t('modal.new_protocol.title.PROTOCOL_FILE')}
                </h2>
                <Flex flexDirection={DIRECTION_COLUMN} width="10rem" alignItems={ALIGN_STRETCH}>
                  <DropdownField
                    options={ROBOT_TYPE_OPTIONS}
                    onChange={handleChange}
                    value={values.fields.robotType}
                    name="fields.robotType"
                  />
                </Flex>
              </Flex>
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

            <h2 className={styles.new_file_modal_title}>
              {i18n.t('modal.new_protocol.title.PROTOCOL_PIPETTES')}
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
              robotType={values.fields.robotType}
            />
            <div className={styles.protocol_modules_group}>
              <h2 className={styles.new_file_modal_title}>
                {i18n.t(
                  'modal.new_protocol.title.PROTOCOL_MODULES'
                )}
              </h2>
              <ModuleFields
                errors={errors.modulesByType ?? null}
                values={values.modulesByType}
                onFieldChange={handleChange}
                onSetFieldValue={setFieldValue}
                onBlur={handleBlur}
                touched={touched.modulesByType ?? null}
                onSetFieldTouched={setFieldTouched}
              />
            </div>
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
                onClick={onCancel}
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
        )
      }}
    </Formik>

  )



}


