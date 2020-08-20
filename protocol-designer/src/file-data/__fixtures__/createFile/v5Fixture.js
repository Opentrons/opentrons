// @flow
// Named arguments to createFile selector. This data would be the result of several selectors.
import type { SavedStepFormState, ModuleEntities } from '../../../step-forms'
import type { RobotState, Timeline } from '../../../step-generation'
import type { StepIdType } from '../../../form-types'

export const initialRobotState: RobotState = {
  labware: {
    trashId: {
      slot: '12',
    },
    tiprackId: {
      slot: '1',
    },
    plateId: {
      slot: '7',
    },
  },
  modules: {},
  pipettes: {
    pipetteId: {
      mount: 'left',
    },
  },
  liquidState: {
    pipettes: {},
    labware: {},
  },
  tipState: {
    pipettes: {},
    tipracks: {},
  },
}

export const robotStateTimeline: Timeline = {
  timeline: [
    {
      commands: [
        {
          command: 'pickUpTip',
          params: {
            pipette: 'pipetteId',
            labware: 'tiprackId',
            well: 'A1',
          },
        },
        {
          command: 'aspirate',
          params: {
            pipette: 'pipetteId',
            volume: 5,
            labware: 'plateId',
            well: 'A1',
            offsetFromBottomMm: 1,
            flowRate: 3.78,
          },
        },
        {
          command: 'moveToWell',
          params: {
            pipette: 'pipetteId',
            labware: 'plateId',
            well: 'A1',
            offset: {
              x: 0,
              y: 0,
              z: 1,
            },
          },
        },
        {
          command: 'delay',
          params: {
            wait: 1,
          },
        },
        {
          command: 'airGap',
          params: {
            pipette: 'pipetteId',
            volume: 1,
            labware: 'plateId',
            well: 'A1',
            offsetFromBottomMm: 15.81,
            flowRate: 3.78,
          },
        },
        {
          command: 'delay',
          params: {
            wait: 1,
          },
        },
        {
          command: 'dispense',
          params: {
            pipette: 'pipetteId',
            volume: 1,
            labware: 'plateId',
            well: 'A12',
            offsetFromBottomMm: 15.81,
            flowRate: 3.78,
          },
        },
        {
          command: 'dispense',
          params: {
            pipette: 'pipetteId',
            volume: 5,
            labware: 'plateId',
            well: 'A12',
            offsetFromBottomMm: 0.5,
            flowRate: 3.78,
          },
        },
        {
          command: 'dropTip',
          params: {
            pipette: 'pipetteId',
            labware: 'trashId',
            well: 'A1',
          },
        },
        {
          command: 'pickUpTip',
          params: {
            pipette: 'pipetteId',
            labware: 'tiprackId',
            well: 'B1',
          },
        },
        {
          command: 'aspirate',
          params: {
            pipette: 'pipetteId',
            volume: 5,
            labware: 'plateId',
            well: 'B1',
            offsetFromBottomMm: 1,
            flowRate: 3.78,
          },
        },
        {
          command: 'moveToWell',
          params: {
            pipette: 'pipetteId',
            labware: 'plateId',
            well: 'B1',
            offset: {
              x: 0,
              y: 0,
              z: 1,
            },
          },
        },
        {
          command: 'delay',
          params: {
            wait: 1,
          },
        },
        {
          command: 'airGap',
          params: {
            pipette: 'pipetteId',
            volume: 1,
            labware: 'plateId',
            well: 'B1',
            offsetFromBottomMm: 15.81,
            flowRate: 3.78,
          },
        },
        {
          command: 'delay',
          params: {
            wait: 1,
          },
        },
        {
          command: 'dispense',
          params: {
            pipette: 'pipetteId',
            volume: 1,
            labware: 'plateId',
            well: 'B12',
            offsetFromBottomMm: 15.81,
            flowRate: 3.78,
          },
        },
        {
          command: 'dispense',
          params: {
            pipette: 'pipetteId',
            volume: 5,
            labware: 'plateId',
            well: 'B12',
            offsetFromBottomMm: 0.5,
            flowRate: 3.78,
          },
        },
        {
          command: 'dropTip',
          params: {
            pipette: 'pipetteId',
            labware: 'trashId',
            well: 'A1',
          },
        },
      ],
      robotState: initialRobotState,
      warnings: [],
    },
  ],
  errors: null,
}

export const savedStepForms: SavedStepFormState = {
  __INITIAL_DECK_SETUP_STEP__: {
    stepType: 'manualIntervention',
    id: '__INITIAL_DECK_SETUP_STEP__',
    labwareLocationUpdate: {
      trashId: '12',
      tiprackId: '2',
      plateId: '1',
    },
    pipetteLocationUpdate: {
      pipetteId: 'left',
    },
    moduleLocationUpdate: {},
  },
  moveLiquidStepId: {
    id: 'moveLiquidStepId',
    stepType: 'moveLiquid',
    stepName: 'transfer',
    stepDetails: '',
    pipette: 'pipetteId',
    volume: '5',
    changeTip: 'always',
    path: 'single',
    aspirate_wells_grouped: false,
    aspirate_flowRate: null,
    aspirate_labware: 'plateId',
    aspirate_wells: ['A1', 'B1'],
    aspirate_wellOrder_first: 't2b',
    aspirate_wellOrder_second: 'l2r',
    aspirate_mix_checkbox: false,
    aspirate_mix_times: null,
    aspirate_mix_volume: null,
    aspirate_mmFromBottom: '1',
    aspirate_touchTip_checkbox: false,
    dispense_flowRate: null,
    dispense_labware: 'plateId',
    dispense_wells: ['A12', 'B12'],
    dispense_wellOrder_first: 't2b',
    dispense_wellOrder_second: 'l2r',
    dispense_mix_checkbox: false,
    dispense_mix_times: null,
    dispense_mix_volume: null,
    dispense_mmFromBottom: '0.5',
    dispense_touchTip_checkbox: false,
    disposalVolume_checkbox: true,
    disposalVolume_volume: '1',
    blowout_checkbox: false,
    blowout_location: 'trashId',
    preWetTip: false,
    aspirate_airGap_checkbox: true,
    aspirate_airGap_volume: '1',
    aspirate_delay_checkbox: true,
    aspirate_delay_mmFromBottom: '1',
    aspirate_delay_seconds: '1',
    dispense_delay_checkbox: false,
    dispense_delay_seconds: '1',
    dispense_delay_mmFromBottom: '0.5',
    //
  },
}
export const orderedStepIds: Array<StepIdType> = ['moveLiquidStepId']

export const moduleEntities: ModuleEntities = {}
