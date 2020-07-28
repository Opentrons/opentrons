// @flow
import {
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import { fixtureP10Single } from '@opentrons/shared-data/pipette/fixtures/name'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul'
import { getPrereleaseFeatureFlag } from '../../persist'
import { getStateAndContextTempTCModules } from '../../step-generation/__fixtures__'
import {
  createPresavedStepForm,
  type CreatePresavedStepFormArgs,
} from '../utils/createPresavedStepForm'
jest.mock('../../persist')

const mockGetPrereleaseFeatureFlag: JestMockFn<
  string,
  boolean
> = getPrereleaseFeatureFlag

const stepId = 'stepId123'
const EXAMPLE_ENGAGE_HEIGHT = '18'
let defaultArgs
beforeEach(() => {
  const { robotState } = getStateAndContextTempTCModules({
    temperatureModuleId: 'someTemperatureModuleId',
    thermocyclerId: 'someThermocyclerModuleId',
  })
  const leftPipette = {
    name: 'p10_single',
    id: 'leftPipetteId',
    spec: fixtureP10Single,
    tiprackLabwareDef: fixture_tiprack_10_ul,
  }
  const labwareOnMagModule = {
    id: 'labwareOnMagModule',
    def: { parameters: { magneticModuleEngageHeight: EXAMPLE_ENGAGE_HEIGHT } },
  }
  defaultArgs = {
    stepId,
    pipetteEntities: {
      leftPipetteId: { ...leftPipette },
    },
    labwareEntities: {
      labwareOnMagModule: {
        labwareOnMagModule,
      },
    },
    savedStepForms: {},
    orderedStepIds: [],
    initialDeckSetup: {
      labware: {
        labwareOnMagModule: {
          ...labwareOnMagModule,
          slot: 'someMagneticModuleId',
        },
      },
      modules: {
        someMagneticModuleId: {
          id: 'someMagneticModuleId',
          type: MAGNETIC_MODULE_TYPE,
          model: MAGNETIC_MODULE_V2,
          slot: '1',
        },
        someTemperatureModuleId: {
          id: 'someTemperatureModuleId',
          type: TEMPERATURE_MODULE_TYPE,
          model: TEMPERATURE_MODULE_V2,
          slot: '3',
        },
        someThermocyclerModuleId: {
          id: 'someTemperatureModuleId',
          type: THERMOCYCLER_MODULE_TYPE,
          model: THERMOCYCLER_MODULE_V1,
          slot: '3',
        },
      },
      pipettes: { leftPipetteId: { ...leftPipette, mount: 'left' } },
    },
    robotStateTimeline: {
      timeline: [
        {
          commands: [],
          robotState,
        },
      ],
    },
  }
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('createPresavedStepForm', () => {
  ;[true, false].forEach(hasTempModule => {
    it(`should populate initial values for a new pause step (with ${
      hasTempModule ? '' : 'NO'
    } temp module)`, () => {
      const args: CreatePresavedStepFormArgs = {
        ...defaultArgs,
        stepType: 'pause',
        initialDeckSetup: hasTempModule
          ? defaultArgs.initialDeckSetup
          : {
              ...defaultArgs.initialDeckSetup,
              modules: {},
            },
      }

      expect(createPresavedStepForm(args)).toEqual({
        id: stepId,
        stepType: 'pause',
        moduleId: hasTempModule ? 'someTemperatureModuleId' : null,
        pauseAction: null,
        pauseHour: null,
        pauseMessage: '',
        pauseMinute: null,
        pauseSecond: null,
        pauseTemperature: null,
        stepDetails: '',
        stepName: 'pause',
      })
    })
  })

  // TODO(IL, 2020-07-28): remove `false` case when 'OT_PD_ENABLE_AIR_GAP_AND_DELAY' FF is removed
  ;[true, false].forEach(airGapEnabled => {
    it(`should call handleFormChange with a default pipette for "moveLiquid" step (air gap FF enabled: ${airGapEnabled})`, () => {
      mockGetPrereleaseFeatureFlag.mockImplementation(
        ff => ff === 'OT_PD_ENABLE_AIR_GAP_AND_DELAY' && airGapEnabled
      )
      const args = {
        ...defaultArgs,
        stepType: 'moveLiquid',
      }

      expect(createPresavedStepForm(args)).toEqual({
        id: stepId,
        pipette: 'leftPipetteId',
        stepType: 'moveLiquid',
        // default fields
        ...(airGapEnabled ? { aspirate_airGap_volume: '1' } : {}),
        aspirate_flowRate: null,
        aspirate_labware: null,
        aspirate_mix_checkbox: false,
        aspirate_mix_times: null,
        aspirate_mix_volume: null,
        aspirate_mmFromBottom: 1,
        aspirate_touchTip_checkbox: false,
        aspirate_wellOrder_first: 't2b',
        aspirate_wellOrder_second: 'l2r',
        aspirate_wells: [],
        aspirate_wells_grouped: false,
        blowout_checkbox: false,
        blowout_location: 'trashId',
        changeTip: 'always',
        dispense_flowRate: null,
        dispense_labware: null,
        dispense_mix_checkbox: false,
        dispense_mix_times: null,
        dispense_mix_volume: null,
        dispense_mmFromBottom: 0.5,
        dispense_touchTip_checkbox: false,
        dispense_wellOrder_first: 't2b',
        dispense_wellOrder_second: 'l2r',
        dispense_wells: [],
        disposalVolume_checkbox: true,
        disposalVolume_volume: '1',
        path: 'single',
        preWetTip: false,
        stepDetails: '',
        stepName: 'transfer',
        volume: null,
      })
    })
  })

  it('should call handleFormChange with a default pipette for mix step', () => {
    const args = {
      ...defaultArgs,
      stepType: 'mix',
    }

    expect(createPresavedStepForm(args)).toEqual({
      id: stepId,
      pipette: 'leftPipetteId',
      stepType: 'mix',
      // default fields
      labware: null,
      wells: [],
      mix_mmFromBottom: 0.5,
      mix_wellOrder_first: 't2b',
      mix_wellOrder_second: 'l2r',
      blowout_checkbox: false,
      blowout_location: 'trashId',
      changeTip: 'always',
      stepDetails: '',
      stepName: 'mix',
      // TODO(IL, 2020-04-27): mix defaults are missing volume, etc!!! Investigate in #3161
    })
  })

  it('should set a default magnetic module for magnet step, and set engage height and magnetAction=engage, when it is the first magnet step in the timeline', () => {
    const args = {
      ...defaultArgs,
      stepType: 'magnet',
    }

    expect(createPresavedStepForm(args)).toEqual({
      id: stepId,
      stepType: 'magnet',
      moduleId: 'someMagneticModuleId',
      engageHeight: EXAMPLE_ENGAGE_HEIGHT,
      magnetAction: 'engage',
      // Default values
      stepName: 'magnet',
      stepDetails: '',
    })
  })

  it('should set a default magnetic module for magnet step, and set magnetAction=disengage, when the previous magnet step is an engage', () => {
    const args = {
      ...defaultArgs,
      savedStepForms: {
        prevStepId: {
          id: 'prevStepId',
          stepType: 'magnet',
          moduleId: 'someMagneticModuleId',
          engageHeight: EXAMPLE_ENGAGE_HEIGHT,
          magnetAction: 'engage',
          stepName: 'magnet',
          stepDetails: '',
        },
      },
      orderedStepIds: ['prevStepId'],
      stepType: 'magnet',
    }

    expect(createPresavedStepForm(args)).toEqual({
      id: stepId,
      stepType: 'magnet',
      moduleId: 'someMagneticModuleId',
      engageHeight: EXAMPLE_ENGAGE_HEIGHT,
      magnetAction: 'disengage',
      stepName: 'magnet',
      stepDetails: '',
    })
  })

  it('should set a default magnetic module for magnet step, and set magnetAction=engage, when the previous magnet step is a disengage', () => {
    const args = {
      ...defaultArgs,
      savedStepForms: {
        prevStepId: {
          id: 'prevStepId',
          stepType: 'magnet',
          moduleId: 'someMagneticModuleId',
          engageHeight: EXAMPLE_ENGAGE_HEIGHT,
          magnetAction: 'disengage',
          stepName: 'magnet',
          stepDetails: '',
        },
      },
      orderedStepIds: ['prevStepId'],
      stepType: 'magnet',
    }

    expect(createPresavedStepForm(args)).toEqual({
      id: stepId,
      stepType: 'magnet',
      moduleId: 'someMagneticModuleId',
      engageHeight: EXAMPLE_ENGAGE_HEIGHT,
      magnetAction: 'engage',
      stepName: 'magnet',
      stepDetails: '',
    })
  })

  it('should set a default temperature module when a Temperature step is added', () => {
    const args = {
      ...defaultArgs,
      stepType: 'temperature',
    }

    expect(createPresavedStepForm(args)).toEqual({
      id: stepId,
      stepType: 'temperature',
      moduleId: 'someTemperatureModuleId',
      // Default fields
      setTemperature: null,
      targetTemperature: null,
      stepName: 'temperature',
      stepDetails: '',
    })
  })
  ;[true, false].forEach(timelineHasErrors => {
    ;[true, false].forEach(isFirstThermocyclerStep => {
      const testName = `should set a default thermocycler module and set TC state defaults when ${
        isFirstThermocyclerStep
          ? 'the first Thermocycler step is added'
          : 'a following Thermocycler step is added'
      }${timelineHasErrors ? ' and timeline has errors' : ''}`
      it(testName, () => {
        // mutate robot state in defaultArgs
        if (timelineHasErrors) {
          defaultArgs.robotStateTimeline = { errors: ['OH NO!'], timeline: [] }
        } else {
          const thermocyclerModuleState =
            defaultArgs.robotStateTimeline.timeline[0].robotState.modules[
              'someThermocyclerModuleId'
            ]
          thermocyclerModuleState.moduleState = {
            ...thermocyclerModuleState.moduleState,
            blockTargetTemp: 42,
            lidTargetTemp: 43,
            lidOpen: true,
          }
        }

        const args = {
          ...defaultArgs,
          stepType: 'thermocycler',
        }

        if (isFirstThermocyclerStep) {
          args.savedStepForms = {
            prevStepId: {
              stepType: 'thermocycler',
              // TC Default fields (should all be ignored, robotState is used to populate the form)
              stepName: 'thermocycler',
              stepDetails: '',
              thermocyclerFormType: 'thermocyclerState',
              blockIsActive: false,
              blockTargetTemp: null,
              lidIsActive: false,
              lidTargetTemp: null,
              lidOpen: null,
              profileVolume: null,
              profileTargetLidTemp: null,
              orderedProfileItems: [],
              profileItemsById: {},
              blockIsActiveHold: false,
              blockTargetTempHold: null,
              lidIsActiveHold: false,
              lidTargetTempHold: null,
              lidOpenHold: null,
            },
          }

          args.orderedStepIds = ['prevStepId']
        }

        expect(createPresavedStepForm(args)).toEqual({
          blockIsActive: !timelineHasErrors,
          blockIsActiveHold: false,
          blockTargetTemp: timelineHasErrors ? null : 42,
          blockTargetTempHold: null,
          id: stepId,
          lidIsActive: !timelineHasErrors,
          lidIsActiveHold: false,
          lidOpen: !timelineHasErrors,
          lidOpenHold: null,
          lidTargetTemp: timelineHasErrors ? null : 43,
          lidTargetTempHold: null,
          moduleId: 'someThermocyclerModuleId',
          orderedProfileItems: [],
          profileItemsById: {},
          profileTargetLidTemp: null,
          profileVolume: null,
          stepDetails: '',
          stepName: 'thermocycler',
          stepType: 'thermocycler',
          thermocyclerFormType: null,
        })
      })
    })
  })
})
