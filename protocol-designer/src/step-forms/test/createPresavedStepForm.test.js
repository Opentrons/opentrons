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
import {
  createPresavedStepForm,
  type CreatePresavedStepFormArgs,
} from '../utils/createPresavedStepForm'

const stepId = 'stepId123'
const EXAMPLE_ENGAGE_HEIGHT = '18'
let defaultArgs
beforeEach(() => {
  const leftPipette = {
    name: 'p10_single',
    id: 'leftPipetteId',
    spec: fixtureP10Single,
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
  }
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

  it('should call handleFormChange with a default pipette for "moveLiquid" step', () => {
    const args = {
      ...defaultArgs,
      stepType: 'moveLiquid',
    }

    expect(createPresavedStepForm(args)).toEqual({
      id: stepId,
      pipette: 'leftPipetteId',
      stepType: 'moveLiquid',
      // default fields
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

  it('should set a default thermocycler module when a Thermocycler step is added', () => {
    const args = {
      ...defaultArgs,
      stepType: 'thermocycler',
    }

    expect(createPresavedStepForm(args)).toEqual({
      id: stepId,
      stepType: 'thermocycler',
      moduleId: 'someThermocyclerModuleId',
      // TODO add TC Default fields once rebased
      stepName: 'thermocycler',
      stepDetails: '',
    })
  })
})
