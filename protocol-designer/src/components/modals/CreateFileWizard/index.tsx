import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import reduce from 'lodash/reduce'
import mapValues from 'lodash/mapValues'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import omit from 'lodash/omit'
import uniq from 'lodash/uniq'
import * as Yup from 'yup'
import { ModalShell } from '@opentrons/components'
import {
  OT2_ROBOT_TYPE,
  TEMPERATURE_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  FLEX_ROBOT_TYPE,
  WASTE_CHUTE_CUTOUT,
  getAreSlotsAdjacent,
} from '@opentrons/shared-data'
import { actions as stepFormActions } from '../../../step-forms'
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
import {
  createDeckFixture,
  toggleIsGripperRequired,
} from '../../../step-forms/actions/additionalItems'
import { createModuleWithNoSlot } from '../../../modules'
import { RobotTypeTile } from './RobotTypeTile'
import { MetadataTile } from './MetadataTile'
import { FirstPipetteTypeTile, SecondPipetteTypeTile } from './PipetteTypeTile'
import { FirstPipetteTipsTile, SecondPipetteTipsTile } from './PipetteTipsTile'
import { ModulesAndOtherTile } from './ModulesAndOtherTile'
import { WizardHeader } from './WizardHeader'
import { StagingAreaTile } from './StagingAreaTile'
import { getTrashSlot } from './utils'

import type {
  ModuleType,
  ModuleModel,
  PipetteName,
} from '@opentrons/shared-data'
import type { NormalizedPipette } from '@opentrons/step-generation'
import type { ThunkDispatch } from 'redux-thunk'
import type {
  FormPipettesByMount,
  FormPipette,
  PipetteOnDeck,
} from '../../../step-forms'
import type { BaseState } from '../../../types'
import type { FormState } from './types'

type WizardStep =
  | 'robotType'
  | 'metadata'
  | 'first_pipette_type'
  | 'first_pipette_tips'
  | 'second_pipette_type'
  | 'second_pipette_tips'
  | 'staging_area'
  | 'modulesAndOther'
const WIZARD_STEPS: WizardStep[] = [
  'robotType',
  'metadata',
  'first_pipette_type',
  'first_pipette_tips',
  'second_pipette_type',
  'second_pipette_tips',
  'staging_area',
  'modulesAndOther',
]
const WIZARD_STEPS_OT2: WizardStep[] = [
  'robotType',
  'metadata',
  'first_pipette_type',
  'first_pipette_tips',
  'second_pipette_type',
  'second_pipette_tips',
  'modulesAndOther',
]
export const adapter96ChannelDefUri =
  'opentrons/opentrons_flex_96_tiprack_adapter/1'

export function CreateFileWizard(): JSX.Element | null {
  const { t } = useTranslation(['modal', 'alert'])
  const showWizard = useSelector(getNewProtocolModal)
  const hasUnsavedChanges = useSelector(loadFileSelectors.getHasUnsavedChanges)
  const customLabware = useSelector(
    labwareDefSelectors.getCustomLabwareDefsByURI
  )
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const [wizardSteps, setWizardSteps] = React.useState<WizardStep[]>(
    WIZARD_STEPS
  )

  React.useEffect(() => {
    // re-initialize wizard step count when modal is closed
    if (!showWizard && currentStepIndex > 0) {
      setCurrentStepIndex(0)
    }
  }, [showWizard])

  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()

  const handleCancel = (): void => {
    dispatch(navigationActions.toggleNewProtocolModal(false))
  }
  const createProtocolFile = (values: FormState): void => {
    const pipettes = reduce<FormPipettesByMount, PipetteFieldsData[]>(
      values.pipettesByMount,
      (acc, formPipette: FormPipette, mount): PipetteFieldsData[] => {
        return formPipette?.pipetteName != null &&
          formPipette?.pipetteName !== '' &&
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

    const modules: ModuleCreationArgs[] =
      values.modules != null
        ? Object.entries(values.modules).reduce<ModuleCreationArgs[]>(
            (acc, [number, formModule]) => {
              return [
                ...acc,
                {
                  type: formModule.type,
                  model: formModule.model || ('' as ModuleModel),
                  slot: formModule.slot,
                },
              ]
            },
            []
          )
        : []
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

    if (!hasUnsavedChanges || window.confirm(t('alert:confirm_create_new'))) {
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

      //  add trash
      if (values.additionalEquipment.includes('trashBin')) {
        // defaulting trash to appropriate locations
        dispatch(
          createDeckFixture(
            'trashBin',
            values.fields.robotType === FLEX_ROBOT_TYPE
              ? getTrashSlot(values)
              : 'cutout12'
          )
        )
      }

      // add waste chute
      if (values.additionalEquipment.includes('wasteChute')) {
        dispatch(createDeckFixture('wasteChute', WASTE_CHUTE_CUTOUT))
      }
      //  add staging areas
      const stagingAreas = values.additionalEquipment.filter(equipment =>
        equipment.includes('stagingArea')
      )
      if (stagingAreas.length > 0) {
        stagingAreas.forEach(stagingArea => {
          const [, location] = stagingArea.split('_')
          dispatch(createDeckFixture('stagingArea', location))
        })
      }

      // create modules
      // sort so modules with slot are created first
      // then modules without a slot are generated in remaining available slots
      modules.sort((a, b) => {
        if (a.slot == null && b.slot != null) {
          return 1
        }
        if (b.slot == null && a.slot != null) {
          return -1
        }
        return 0
      })

      modules.forEach(moduleArgs => {
        return moduleArgs.slot != null
          ? dispatch(stepFormActions.createModule(moduleArgs))
          : dispatch(
              createModuleWithNoSlot({
                model: moduleArgs.model,
                type: moduleArgs.type,
              })
            )
      })

      // add gripper
      if (values.additionalEquipment.includes('gripper')) {
        dispatch(toggleIsGripperRequired())
      }
      // auto-generate tipracks for pipettes
      const newTiprackModels: string[] = uniq(
        pipettes.flatMap(pipette => pipette.tiprackDefURI)
      )
      const FLEX_MIDDLE_SLOTS = ['C2', 'B2', 'A2']
      const hasOt2TC = modules.find(
        module => module.type === THERMOCYCLER_MODULE_TYPE
      )
      const heaterShakerSlot = modules.find(
        module => module.type === HEATERSHAKER_MODULE_TYPE
      )?.slot
      const OT2_MIDDLE_SLOTS = hasOt2TC ? ['2', '5'] : ['2', '5', '8', '11']
      const modifiedOt2Slots = OT2_MIDDLE_SLOTS.filter(slot =>
        heaterShakerSlot != null
          ? !getAreSlotsAdjacent(heaterShakerSlot, slot)
          : slot
      )
      newTiprackModels.forEach((tiprackDefURI, index) => {
        dispatch(
          labwareIngredActions.createContainer({
            slot:
              values.fields.robotType === FLEX_ROBOT_TYPE
                ? FLEX_MIDDLE_SLOTS[index]
                : modifiedOt2Slots[index],
            labwareDefURI: tiprackDefURI,
            adapterUnderLabwareDefURI:
              values.pipettesByMount.left.pipetteName === 'p1000_96'
                ? adapter96ChannelDefUri
                : undefined,
          })
        )
      })
    }
  }
  const wizardHeader = (
    <WizardHeader
      title={t('create_new_protocol')}
      currentStep={currentStepIndex}
      totalSteps={wizardSteps.length - 1}
      onExit={handleCancel}
    />
  )
  const currentWizardStep = wizardSteps[currentStepIndex]
  const goBack = (stepsBack: number = 1): void => {
    if (currentStepIndex >= 0 + stepsBack) {
      setCurrentStepIndex(currentStepIndex - stepsBack)
    }
  }
  const proceed = (stepsForward: number = 1): void => {
    if (currentStepIndex + stepsForward < wizardSteps.length) {
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
        setWizardSteps={setWizardSteps}
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
  modules: {},
  //  defaulting to selecting trashBin already to avoid user having to
  //  click to add a trash bin/waste chute. Delete once we support returnTip()
  additionalEquipment: ['trashBin'],
}

const pipetteValidationShape = Yup.object().shape({
  pipetteName: Yup.string().nullable(),
  tiprackDefURI: Yup.array()
    .of(Yup.string())
    .nullable()
    .when('pipetteName', {
      is: (val: string | null): boolean => Boolean(val),
      then: schema => schema.required('Required'),
      otherwise: schema => schema.nullable(),
    }),
})
// any typing this because TS says there are too many possibilities of what this could be
const moduleValidationShape: any = Yup.object().shape({
  type: Yup.string(),
  model: Yup.string(),
  slot: Yup.string(),
})

const validationSchema: any = Yup.object().shape({
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
  setWizardSteps: React.Dispatch<React.SetStateAction<WizardStep[]>>
}

function CreateFileForm(props: CreateFileFormProps): JSX.Element {
  const {
    currentWizardStep,
    createProtocolFile,
    proceed,
    goBack,
    setWizardSteps,
  } = props
  const { ...formProps } = useForm<FormState>({
    defaultValues: initialFormState,
    resolver: yupResolver(validationSchema),
  })

  const handleProceedRobotType = (robotType: string): void => {
    if (robotType === OT2_ROBOT_TYPE) {
      setWizardSteps(WIZARD_STEPS_OT2)
    } else {
      setWizardSteps(WIZARD_STEPS)
    }
  }

  return (
    <form onSubmit={formProps.handleSubmit(() => {})}>
      {(() => {
        switch (currentWizardStep) {
          case 'robotType':
            return (
              <RobotTypeTile
                {...formProps}
                goBack={goBack}
                proceed={() => {
                  handleProceedRobotType(formProps.getValues().fields.robotType)
                  proceed()
                }}
              />
            )
          case 'metadata':
            return (
              <MetadataTile {...formProps} proceed={proceed} goBack={goBack} />
            )
          case 'first_pipette_type':
            return (
              <FirstPipetteTypeTile {...{ ...formProps, proceed, goBack }} />
            )
          case 'first_pipette_tips':
            return (
              <FirstPipetteTipsTile {...{ ...formProps, proceed, goBack }} />
            )
          case 'second_pipette_type':
            return (
              <SecondPipetteTypeTile {...{ ...formProps, proceed, goBack }} />
            )
          case 'second_pipette_tips':
            return (
              <SecondPipetteTipsTile {...{ ...formProps, proceed, goBack }} />
            )
          case 'staging_area':
            return <StagingAreaTile {...{ ...formProps, proceed, goBack }} />
          case 'modulesAndOther':
            return (
              <ModulesAndOtherTile
                {...formProps}
                proceed={() => createProtocolFile(formProps.getValues())}
                goBack={goBack}
              />
            )
          default:
            return null
        }
      })()}
    </form>
  )
}
