import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { yupResolver } from '@hookform/resolvers/yup'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import reduce from 'lodash/reduce'
import uniq from 'lodash/uniq'
import * as Yup from 'yup'

import { Box, COLORS } from '@opentrons/components'
import {
  FLEX_96_CHANNEL_PIPETTES,
  FLEX_ROBOT_TYPE,
  getAreSlotsAdjacent,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_MODULE_TYPE,
  OT2_ROBOT_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'

import { INITIAL_DECK_SETUP_STEP_ID } from '../../constants'
import * as labwareDefActions from '../../labware-defs/actions'
import * as labwareDefSelectors from '../../labware-defs/selectors'
import * as labwareIngredActions from '../../labware-ingred/actions'
import { actions as fileActions } from '../../load-file'
import { toggleNewProtocolModal } from '../../navigation/actions'
import { actions as stepFormActions } from '../../step-forms'
import {
  createDeckFixture,
  toggleIsGripperRequired,
} from '../../step-forms/actions/additionalItems'
import { actions as steplistActions } from '../../steplist'
import { uuid } from '../../utils'
import { AddMetadata } from './AddMetadata'
import { FLEX_TRASH_FIXTURE_INFO } from './constants'
import { SelectBasics } from './SelectBasics'
import { SelectFlexHardware } from './SelectFlexHardware'

import type { ThunkDispatch } from 'redux-thunk'
import type { Dispatch, SetStateAction } from 'react'
import type {
  ModuleModel,
  ModuleType,
  PipetteName,
} from '@opentrons/shared-data'
import type { NormalizedPipette } from '@opentrons/step-generation'
import type { WizardFormState } from '../../components/organisms'
import type {
  FormPipette,
  FormPipettesByMount,
  PipetteOnDeck,
} from '../../step-forms'
import type { BaseState } from '../../types'

type WizardStep = 'basics' | 'modules' | 'metadata'
const WIZARD_STEPS: WizardStep[] = ['basics', 'modules', 'metadata']

const adapter96ChannelDefUri = 'opentrons/opentrons_flex_96_tiprack_adapter/1'

type PipetteFieldsData = Omit<
  PipetteOnDeck,
  'id' | 'spec' | 'tiprackLabwareDef' | 'pythonName'
>

interface ModuleCreationArgs {
  type: ModuleType
  model: ModuleModel
  slot: string
}

const initialFormState: WizardFormState = {
  fields: {
    name: undefined,
    description: undefined,
    organizationOrAuthor: undefined,
    robotType: FLEX_ROBOT_TYPE,
  },
  pipettesByMount: {
    left: { pipetteName: undefined, tiprackDefURI: undefined },
    right: { pipetteName: undefined, tiprackDefURI: undefined },
  },
  modules: {},
  hasGripper: null,
  fixtures: { [uuid()]: FLEX_TRASH_FIXTURE_INFO },
  hasThermocycler: null,
  hasWasteChute: null,
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
      //  @ts-expect-error todo: fix this
      Object.keys(value).some((val: string) => value[val].pipetteName)
    ),
  modulesByType: Yup.object().shape({
    [MAGNETIC_MODULE_TYPE]: moduleValidationShape,
    [TEMPERATURE_MODULE_TYPE]: moduleValidationShape,
    [THERMOCYCLER_MODULE_TYPE]: moduleValidationShape,
    [HEATERSHAKER_MODULE_TYPE]: moduleValidationShape,
    [MAGNETIC_BLOCK_TYPE]: moduleValidationShape,
  }),
})

export function Onboarding(): JSX.Element | null {
  const navigate = useNavigate()
  const [analyticsStartTime] = useState<Date>(new Date())
  const customLabware = useSelector(
    labwareDefSelectors.getCustomLabwareDefsByURI
  )
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const wizardSteps = WIZARD_STEPS

  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()

  const createProtocolFile = (values: WizardFormState): void => {
    navigate('/overview')

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

    if (values.fields.robotType === OT2_ROBOT_TYPE) {
      const heaterShakerIndex = modules.findIndex(
        mod => mod.type === HEATERSHAKER_MODULE_TYPE
      )
      const magModIndex = modules.findIndex(
        mod => mod.type === MAGNETIC_MODULE_TYPE
      )
      if (heaterShakerIndex > -1 && magModIndex > -1) {
        // if both are present, move the Magnetic module to slot 9, since both can't be in slot 1
        modules[magModIndex].slot = '9'
      }
    }
    const newProtocolFields = values.fields

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
            (p: (typeof pipettesById)[keyof typeof pipettesById]) => p.mount
          ),
        },
      })
    )

    const trashFixture = Object.values(values.fixtures).find(
      fixture => fixture.name === 'trashBin'
    )
    //  add trash
    if (trashFixture != null) {
      dispatch(createDeckFixture('trashBin', trashFixture.cutoutId))
    }

    // add waste chute
    if (
      Object.values(values.fixtures).some(
        fixture => fixture.name === 'wasteChute'
      )
    ) {
      dispatch(createDeckFixture('wasteChute', WASTE_CHUTE_CUTOUT))
    }
    //  add staging areas
    const stagingAreas = Object.values(values.fixtures).filter(
      fixture => fixture.name === 'stagingArea'
    )

    if (stagingAreas.length > 0) {
      stagingAreas.forEach(info => {
        return dispatch(createDeckFixture('stagingArea', info.cutoutId))
      })
    }

    // create modules
    modules.forEach(moduleArgs => {
      return dispatch(stepFormActions.createModule(moduleArgs))
    })

    // add gripper
    if (values.hasGripper) {
      dispatch(toggleIsGripperRequired())
    }

    // auto-generate assigned tipracks for pipettes
    const newTiprackModels: string[] = uniq(
      pipettes.flatMap(pipette => pipette.tiprackDefURI)
    )
    const hasMagneticBlock = modules.some(
      module => module.type === MAGNETIC_BLOCK_TYPE
    )
    const FLEX_MIDDLE_SLOTS = hasMagneticBlock ? [] : ['C2', 'B2', 'A2']
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
          labwareDefURIStack: [
            ...(values.pipettesByMount.left.pipetteName != null &&
            FLEX_96_CHANNEL_PIPETTES.includes(
              values.pipettesByMount.left.pipetteName
            )
              ? [adapter96ChannelDefUri]
              : []),
            tiprackDefURI,
          ],
        })
      )
    })

    dispatch(labwareIngredActions.generateNewProtocol({ isNewProtocol: true }))
  }

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

  return (
    <Box backgroundColor={COLORS.grey10} height="calc(100vh - 48px)">
      <CreateFileForm
        currentWizardStep={currentWizardStep}
        createProtocolFile={createProtocolFile}
        proceed={proceed}
        goBack={goBack}
        analyticsStartTime={analyticsStartTime}
        setCurrentStepIndex={setCurrentStepIndex}
      />
    </Box>
  )
}

interface CreateFileFormProps {
  currentWizardStep: WizardStep
  createProtocolFile: (values: WizardFormState) => void
  goBack: () => void
  proceed: () => void
  analyticsStartTime: Date
  setCurrentStepIndex: Dispatch<SetStateAction<number>>
}

function CreateFileForm(props: CreateFileFormProps): JSX.Element {
  const {
    currentWizardStep,
    createProtocolFile,
    proceed,
    goBack,
    analyticsStartTime,
    setCurrentStepIndex,
  } = props
  const location = useLocation()
  const { ...formProps } = useForm<WizardFormState>({
    defaultValues: initialFormState,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    resolver: yupResolver(validationSchema),
  })
  const dispatch = useDispatch()

  // for resetting the onboarding page back to empty and page 1 when you hit "create new"
  //  from the nav bar
  useEffect(
    () => {
      if (location.state?.modalResetKey) {
        formProps.reset()
        setCurrentStepIndex(0)
        dispatch(toggleNewProtocolModal(true))
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.state?.modalResetKey]
  )

  return (
    <form onSubmit={formProps.handleSubmit(() => {})}>
      {(() => {
        switch (currentWizardStep) {
          case 'basics':
            return <SelectBasics {...{ ...formProps, proceed, goBack }} />
          case 'modules':
            return <SelectFlexHardware {...{ ...formProps, proceed, goBack }} />
          case 'metadata':
            return (
              <AddMetadata
                {...formProps}
                proceed={() => {
                  createProtocolFile(formProps.getValues())
                }}
                goBack={goBack}
                analyticsStartTime={analyticsStartTime}
              />
            )
          default:
            return null
        }
      })()}
    </form>
  )
}
