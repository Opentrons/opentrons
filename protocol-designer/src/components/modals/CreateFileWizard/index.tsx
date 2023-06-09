import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import reduce from 'lodash/reduce'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import uniq from 'lodash/uniq'
import { Formik, FormikProps } from 'formik'
import * as Yup from 'yup'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ModalShell,
  PrimaryButton,
  SPACING,
  SecondaryButton,
} from '@opentrons/components'
import { INITIAL_DECK_SETUP_STEP_ID } from '../../../constants'
import { uuid } from '../../../utils'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import { actions as navigationActions } from '../../../navigation'
import { getNewProtocolModal } from '../../../navigation/selectors'
import { actions as fileActions, selectors as loadFileSelectors } from '../../../load-file'
import * as labwareDefSelectors from '../../../labware-defs/selectors'
import * as labwareDefActions from '../../../labware-defs/actions'
import * as labwareIngredActions from '../../../labware-ingred/actions'
import { actions as steplistActions } from '../../../steplist'

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
  getPipetteNameSpecs
} from '@opentrons/shared-data'
import { CrashInfoBox, isModuleWithCollisionIssue } from '../../modules'

import {
  actions as stepFormActions,
  FormPipettesByMount,
  FormModulesByType,
  FormPipette,
  getIsCrashablePipetteSelected,
  PipetteOnDeck,
} from '../../../step-forms'

import type { NormalizedPipette } from '@opentrons/step-generation'
import type { FormState } from './types'
import { RobotTypeTile } from './RobotTypeTile'
import { MetadataTile } from './MetadataTile'
import { PipettesTile } from './PipettesTile'
import { ModulesAndOtherTile } from './ModulesAndOtherTile'
import { WizardHeader } from './WizardHeader'

type WizardStep = 'robotType' | 'metadata' | 'pipettes' | 'modulesAndOther'
const WIZARD_STEPS: WizardStep[] = ['robotType', 'metadata', 'pipettes', 'modulesAndOther']
export function CreateFileWizard(): JSX.Element | null {
  const { i18n, t } = useTranslation()
  const showWizard = useSelector(getNewProtocolModal)
  const moduleRestrictionsDisabled = useSelector(featureFlagSelectors.getDisableModuleRestrictions)
  const hasUnsavedChanges = useSelector(loadFileSelectors.getHasUnsavedChanges)
  const customLabware = useSelector(labwareDefSelectors.getCustomLabwareDefsByURI)

  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)

  const dispatch = useDispatch()

  const handleCancel = (): void => { dispatch(navigationActions.toggleNewProtocolModal(false)) }
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
    const newProtocolFields = values.fields

    if (!hasUnsavedChanges || window.confirm(t('alert.window.confirm_create_new'))) {
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
      title={t('modal.create_file_wizard.create_new_protocol')}
      currentStep={currentStepIndex}
      totalSteps={WIZARD_STEPS.length}
      onExit={handleCancel}
    />
  )
  const currentWizardStep = WIZARD_STEPS[currentStepIndex]
  return showWizard ? (
    <ModalShell width="48rem" header={wizardHeader}>
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing16}>
        <CreateFileForm
          moduleRestrictionsDisabled={moduleRestrictionsDisabled}
          currentWizardStep={currentWizardStep}
          handleSubmit={handleSubmit}
        />
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
          {currentWizardStep !== 'robotType' ? (
            <SecondaryButton onClick={() => {
              if (currentStepIndex > 0) {
                setCurrentStepIndex(currentStepIndex - 1)
              }
            }}>
              {i18n.format(t('shared.go_back'), 'capitalize')}
            </SecondaryButton>
          ) : <Flex />
          }
          {currentWizardStep === 'modulesAndOther' ?
            (
              <PrimaryButton onClick={handleSubmit}>{t('modal.create_file_wizard.create_protocol_on_to_liquids')}</PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => { setCurrentStepIndex(currentStepIndex + 1) }}>
                {i18n.format(t('shared.next'), 'capitalize')}
              </PrimaryButton>
            )
          }
        </Flex>
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

const initialFormState: FormState = {
  fields: {
    name: '',
    description: '',
    organizationOrAuthor: '',
    robotType: OT2_ROBOT_TYPE
  },
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


interface CreateFileFormProps {
  moduleRestrictionsDisabled?: boolean | null
  currentWizardStep: WizardStep
  handleSubmit: (values: FormState) => void
}

function CreateFileForm(props: CreateFileFormProps): JSX.Element {
  const { moduleRestrictionsDisabled, currentWizardStep, handleSubmit } = props
  const contentsByWizardStep: { [wizardStep in WizardStep]: (formikProps: FormikProps<FormState>) => JSX.Element } = {
    robotType: (formikProps: FormikProps<FormState>) => <RobotTypeTile {...formikProps} />,
    metadata: (formikProps: FormikProps<FormState>) => <MetadataTile {...formikProps} />,
    pipettes: (formikProps: FormikProps<FormState>) => <PipettesTile {...formikProps} />,
    modulesAndOther: (formikProps: FormikProps<FormState>) => <ModulesAndOtherTile {...formikProps} />,
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
      {(formikProps: FormikProps<FormState>) => {
        const { handleSubmit, values } = formikProps
        const { left, right } = values.pipettesByMount

        // TODO: validation
        // const pipetteSelectionIsValid =
        //   // at least one must not be none (empty string)
        //   left.pipetteName || right.pipetteName

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

        const crashablePipetteSelected = getIsCrashablePipetteSelected(values.pipettesByMount)
        const modCrashWarning = (
          <CrashInfoBox
            showDiagram
            showMagPipetteCollisons={crashablePipetteSelected && hasCrashableMagnetModuleSelected}
            showTempPipetteCollisons={crashablePipetteSelected && hasCrashableTemperatureModuleSelected}
            showHeaterShakerLabwareCollisions={hasHeaterShakerSelected}
            showHeaterShakerModuleCollisions={hasHeaterShakerSelected}
            showHeaterShakerPipetteCollisions={showHeaterShakerPipetteCollisions}
          />
        )

        return (
          <form onSubmit={handleSubmit}>
            {contentsByWizardStep[currentWizardStep](formikProps)}
            {
              !moduleRestrictionsDisabled &&
                currentWizardStep === 'modulesAndOther'
                ? modCrashWarning
                : null
            }
          </form>
        )
      }}
    </Formik>
  )
}


