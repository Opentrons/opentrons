import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import reduce from 'lodash/reduce'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import uniq from 'lodash/uniq'
import { Formik, FormikProps } from 'formik'
import * as Yup from 'yup'
import { ModalShell } from '@opentrons/components'
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
} from '@opentrons/shared-data'
import {
  actions as stepFormActions,
  FormPipettesByMount,
  FormPipette,
  PipetteOnDeck,
} from '../../../step-forms'
import { INITIAL_DECK_SETUP_STEP_ID } from '../../../constants'
import { uuid } from '../../../utils'
import { actions as navigationActions } from '../../../navigation'
import { getNewProtocolModal } from '../../../navigation/selectors'
import {
  actions as fileActions,
  selectors as loadFileSelectors,
} from '../../../load-file'
import * as labwareDefSelectors from '../../../labware-defs/selectors'
import * as labwareDefActions from '../../../labware-defs/actions'
import * as labwareIngredActions from '../../../labware-ingred/actions'
import { actions as steplistActions } from '../../../steplist'
import { toggleIsGripperRequired } from '../../../step-forms/actions/additionalItems'
import { RobotTypeTile } from './RobotTypeTile'
import { MetadataTile } from './MetadataTile'
import { FirstPipetteTypeTile, SecondPipetteTypeTile } from './PipetteTypeTile'
import { FirstPipetteTipsTile, SecondPipetteTipsTile } from './PipetteTipsTile'
import { ModulesAndOtherTile } from './ModulesAndOtherTile'
import { WizardHeader } from './WizardHeader'

import type { NormalizedPipette } from '@opentrons/step-generation'
import type { FormState } from './types'

type WizardStep =
  | 'robotType'
  | 'metadata'
  | 'first_pipette_type'
  | 'first_pipette_tips'
  | 'second_pipette_type'
  | 'second_pipette_tips'
  | 'modulesAndOther'
const WIZARD_STEPS: WizardStep[] = [
  'robotType',
  'metadata',
  'first_pipette_type',
  'first_pipette_tips',
  'second_pipette_type',
  'second_pipette_tips',
  'modulesAndOther',
]

export function CreateFileWizard(): JSX.Element | null {
  const { t } = useTranslation()
  const showWizard = useSelector(getNewProtocolModal)
  const hasUnsavedChanges = useSelector(loadFileSelectors.getHasUnsavedChanges)
  const customLabware = useSelector(
    labwareDefSelectors.getCustomLabwareDefsByURI
  )

  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)

  React.useEffect(() => {
    // re-initialize wizard step count when modal is closed
    if (!showWizard && currentStepIndex > 0) {
      setCurrentStepIndex(0)
    }
  }, [showWizard])

  const dispatch = useDispatch()

  const handleCancel = (): void => {
    dispatch(navigationActions.toggleNewProtocolModal(false))
  }
  const createProtocolFile = (values: FormState): void => {
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

    const modules: ModuleCreationArgs[] = Object.entries(
      values.modulesByType
    ).reduce<ModuleCreationArgs[]>((acc, [moduleType, formModule]) => {
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
    const heaterShakerIndex = modules.findIndex(
      mod => mod.type === HEATERSHAKER_MODULE_TYPE
    )
    const magModIndex = modules.findIndex(
      mod => mod.type === MAGNETIC_MODULE_TYPE
    )
    if (heaterShakerIndex > -1 && magModIndex > -1) {
      // if both are present, move the Mag mod to slot 9, since both can't be in slot 1
      modules[magModIndex].slot = '9'
    }
    const newProtocolFields = values.fields

    if (
      !hasUnsavedChanges ||
      window.confirm(t('alert.window.confirm_create_new'))
    ) {
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
      // add gripper
      if (values.additionalEquipment.includes('gripper')) {
        dispatch(toggleIsGripperRequired())
      }
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
  const goBack = (stepsBack: number = 1): void => {
    if (currentStepIndex >= 0 + stepsBack) {
      setCurrentStepIndex(currentStepIndex - stepsBack)
    }
  }
  const proceed = (stepsForward: number = 1): void => {
    if (currentStepIndex + stepsForward < WIZARD_STEPS.length) {
      setCurrentStepIndex(currentStepIndex + stepsForward)
    }
  }

  return showWizard ? (
    <ModalShell width="48rem" header={wizardHeader}>
      <CreateFileForm
        currentWizardStep={currentWizardStep}
        createProtocolFile={createProtocolFile}
        proceed={proceed}
        goBack={goBack}
      />
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
    name: undefined,
    description: undefined,
    organizationOrAuthor: undefined,
    robotType: OT2_ROBOT_TYPE,
  },
  pipettesByMount: {
    left: { pipetteName: undefined, tiprackDefURI: undefined },
    right: { pipetteName: undefined, tiprackDefURI: undefined },
  },
  modulesByType: {
    [MAGNETIC_BLOCK_TYPE]: {
      onDeck: false,
      model: MAGNETIC_BLOCK_V1,
      slot: '2',
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
  additionalEquipment: [],
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
    name: Yup.string().required('Required'),
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
  currentWizardStep: WizardStep
  createProtocolFile: (values: FormState) => void
  goBack: () => void
  proceed: () => void
}

function CreateFileForm(props: CreateFileFormProps): JSX.Element {
  const { currentWizardStep, createProtocolFile, proceed, goBack } = props

  const contentsByWizardStep: {
    [wizardStep in WizardStep]: (
      formikProps: FormikProps<FormState>
    ) => JSX.Element
  } = {
    robotType: (formikProps: FormikProps<FormState>) => (
      <RobotTypeTile {...{ ...formikProps, proceed, goBack }} />
    ),
    metadata: (formikProps: FormikProps<FormState>) => (
      <MetadataTile {...{ ...formikProps, proceed, goBack }} />
    ),
    first_pipette_type: (formikProps: FormikProps<FormState>) => (
      <FirstPipetteTypeTile {...{ ...formikProps, proceed, goBack }} />
    ),
    first_pipette_tips: (formikProps: FormikProps<FormState>) => (
      <FirstPipetteTipsTile {...{ ...formikProps, proceed, goBack }} />
    ),
    second_pipette_type: (formikProps: FormikProps<FormState>) => (
      <SecondPipetteTypeTile {...{ ...formikProps, proceed, goBack }} />
    ),
    second_pipette_tips: (formikProps: FormikProps<FormState>) => (
      <SecondPipetteTipsTile {...{ ...formikProps, proceed, goBack }} />
    ),
    modulesAndOther: (formikProps: FormikProps<FormState>) => (
      <ModulesAndOtherTile
        {...formikProps}
        proceed={() => createProtocolFile(formikProps.values)}
        goBack={goBack}
      />
    ),
  }

  return (
    <Formik
      enableReinitialize
      initialValues={initialFormState}
      onSubmit={() => {}}
      validationSchema={validationSchema}
    >
      {(formikProps: FormikProps<FormState>) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
          const { name, value } = e.target
          formikProps.setFieldValue(name, value)
          formikProps.setFieldTouched(name, true)
        }

        return contentsByWizardStep[currentWizardStep]({
          ...formikProps,
          handleChange,
        })
      }}
    </Formik>
  )
}
